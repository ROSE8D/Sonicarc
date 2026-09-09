"""Reusable, deterministic audio-to-chord analysis.

The detector deliberately has no network/model dependency.  It extracts harmonic
chroma, matches major/minor templates, and merges stable frame labels into timed
segments.  More sophisticated decoders can replace ``ChordAnalyzer`` later while
keeping the API response stable.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path
import tempfile

import librosa
import numpy as np
from scipy.ndimage import median_filter


NOTE_NAMES = ("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")
MAJOR_PROFILE = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR_PROFILE = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])


class ChordAnalysisError(ValueError):
    """An audio payload cannot produce a meaningful chord analysis."""


@dataclass(frozen=True)
class ChordSegment:
    chord: str
    start: float
    end: float
    confidence: float


class ChordAnalyzer:
    """Estimate major/minor triads, key, and tempo from an audio file."""

    def __init__(self, sample_rate: int = 22050, hop_length: int = 512):
        self.sample_rate = sample_rate
        self.hop_length = hop_length
        self._templates, self._labels = self._build_templates()

    @staticmethod
    def _build_templates() -> tuple[np.ndarray, list[str]]:
        templates, labels = [], []
        for root, note in enumerate(NOTE_NAMES):
            for quality, intervals in (("Major", (0, 4, 7)), ("Minor", (0, 3, 7))):
                template = np.zeros(12)
                template[[(root + interval) % 12 for interval in intervals]] = 1
                # A small root emphasis helps resolve relative major/minor ambiguity.
                template[root] = 1.15
                templates.append(template / np.linalg.norm(template))
                labels.append(f"{note} {quality}")
        return np.asarray(templates), labels

    def analyze_bytes(self, audio: bytes, suffix: str = ".wav") -> dict:
        if not audio:
            raise ChordAnalysisError("The uploaded audio file is empty.")
        safe_suffix = suffix if suffix.lower() in {".wav", ".mp3", ".flac", ".ogg", ".m4a", ".webm", ".aac"} else ".audio"
        path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=safe_suffix, delete=False) as handle:
                handle.write(audio)
                path = Path(handle.name)
            return self.analyze_file(path)
        finally:
            if path:
                path.unlink(missing_ok=True)

    def analyze_file(self, path: str | Path) -> dict:
        try:
            signal, sample_rate = librosa.load(path, sr=self.sample_rate, mono=True)
        except Exception as exc:
            raise ChordAnalysisError("Audio could not be decoded. Use WAV, MP3, FLAC, OGG, M4A, AAC, or WebM audio.") from exc

        duration = float(librosa.get_duration(y=signal, sr=sample_rate))
        if duration < 0.5:
            raise ChordAnalysisError("Audio must be at least 0.5 seconds long.")
        peak = float(np.max(np.abs(signal))) if signal.size else 0.0
        if not np.isfinite(peak) or peak < 1e-4:
            raise ChordAnalysisError("No audible signal was found in the audio.")

        signal = librosa.util.normalize(signal)
        harmonic = librosa.effects.harmonic(signal, margin=3.0)
        chroma = librosa.feature.chroma_cqt(y=harmonic, sr=sample_rate, hop_length=self.hop_length)
        if chroma.shape[1] < 2 or not np.any(np.isfinite(chroma)):
            raise ChordAnalysisError("Not enough harmonic information was found to detect chords.")

        labels, confidences = self._classify_frames(chroma)
        segments = self._segments(labels, confidences, duration, sample_rate)
        musical_segments = [segment for segment in segments if segment.chord != "N"]
        if not musical_segments:
            raise ChordAnalysisError("No sufficiently reliable major or minor chords were detected.")

        key, key_confidence = self._estimate_key(chroma)
        bpm, bpm_confidence = self._estimate_tempo(signal, sample_rate, duration)
        return {
            "key": key,
            "key_confidence": round(key_confidence, 3),
            "bpm": bpm,
            "bpm_confidence": bpm_confidence,
            "duration": round(duration, 3),
            "chords": [asdict(segment) for segment in segments],
            "method": "harmonic-cqt-template-v1",
        }

    def _classify_frames(self, chroma: np.ndarray) -> tuple[list[str], np.ndarray]:
        smoothed = median_filter(chroma, size=(1, 5), mode="nearest")
        norms = np.linalg.norm(smoothed, axis=0)
        normalized = smoothed / np.maximum(norms, 1e-8)
        scores = self._templates @ normalized
        best = np.argmax(scores, axis=0)
        sorted_scores = np.sort(scores, axis=0)
        confidence = np.clip((scores[best, np.arange(scores.shape[1])] - sorted_scores[-2]) * 2.5, 0, 1)
        energy_floor = max(float(np.percentile(norms, 15)) * 0.35, 0.015)
        labels = [self._labels[index] if norms[i] >= energy_floor and confidence[i] >= 0.08 else "N" for i, index in enumerate(best)]

        # Suppress isolated classifications without inventing labels for rejected frames.
        for i in range(1, len(labels) - 1):
            if labels[i - 1] == labels[i + 1] and labels[i] != labels[i - 1]:
                labels[i] = labels[i - 1]
                confidence[i] = min(confidence[i - 1], confidence[i + 1])
        return labels, confidence

    def _segments(self, labels: list[str], confidence: np.ndarray, duration: float, sample_rate: int) -> list[ChordSegment]:
        times = librosa.frames_to_time(np.arange(len(labels) + 1), sr=sample_rate, hop_length=self.hop_length)
        segments: list[ChordSegment] = []
        start = 0
        for i in range(1, len(labels) + 1):
            if i == len(labels) or labels[i] != labels[start]:
                end = min(float(times[i]), duration)
                segment = ChordSegment(labels[start], round(float(times[start]), 3), round(end, 3), round(float(np.mean(confidence[start:i])), 3))
                # Absorb very short jitter into the preceding equal-time region.
                if segments and segment.end - segment.start < 0.12:
                    previous = segments[-1]
                    segments[-1] = ChordSegment(previous.chord, previous.start, segment.end, previous.confidence)
                else:
                    segments.append(segment)
                start = i
        if segments:
            last = segments[-1]
            segments[-1] = ChordSegment(last.chord, last.start, round(duration, 3), last.confidence)
        return segments

    @staticmethod
    def _estimate_key(chroma: np.ndarray) -> tuple[str, float]:
        pitch = np.mean(chroma, axis=1)
        pitch = (pitch - pitch.mean()) / (pitch.std() + 1e-8)
        candidates: list[tuple[float, str]] = []
        for root, note in enumerate(NOTE_NAMES):
            for quality, profile in (("Major", MAJOR_PROFILE), ("Minor", MINOR_PROFILE)):
                rotated = np.roll(profile, root)
                score = float(np.corrcoef(pitch, rotated)[0, 1])
                candidates.append((score, f"{note} {quality}"))
        candidates.sort(reverse=True)
        margin = max(0.0, candidates[0][0] - candidates[1][0])
        return candidates[0][1], min(1.0, margin * 2.5)

    @staticmethod
    def _estimate_tempo(signal: np.ndarray, sample_rate: int, duration: float) -> tuple[float | None, float | None]:
        onset = librosa.onset.onset_strength(y=signal, sr=sample_rate)
        tempo, beats = librosa.beat.beat_track(onset_envelope=onset, sr=sample_rate, units="frames")
        tempo_value = float(np.asarray(tempo).reshape(-1)[0])
        if duration < 5 or len(beats) < 4 or not np.isfinite(tempo_value):
            return None, None
        beat_strength = onset[beats]
        confidence = float(np.mean(beat_strength) / (np.mean(onset) + 1e-8))
        if confidence < 1.15:
            return None, round(min(confidence / 2, 1.0), 3)
        return round(tempo_value, 1), round(min(confidence / 3, 1.0), 3)
