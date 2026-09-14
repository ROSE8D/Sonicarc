"""Deterministic dominant-pitch tracking and conversion into musical note events."""

from __future__ import annotations

from dataclasses import asdict, dataclass

import librosa
import numpy as np
from scipy.ndimage import median_filter


@dataclass(frozen=True)
class NoteEvent:
    note: str
    midi: int
    frequency: float
    start: float
    end: float
    confidence: float


class PitchAnalyzer:
    """Track a monophonic or dominant fundamental with librosa's pYIN.

    pYIN is a probabilistic, signal-processing pitch estimator: it does not use
    a hosted service or generative model. The returned events are deliberately
    coarser than its frame-level output.
    """

    def __init__(
        self,
        sample_rate: int = 22050,
        hop_length: int = 256,
        minimum_duration: float = 0.09,
        confidence_floor: float = 0.72,
    ):
        self.sample_rate = sample_rate
        self.hop_length = hop_length
        self.minimum_duration = minimum_duration
        self.confidence_floor = confidence_floor

    def analyze(self, signal: np.ndarray, sample_rate: int | None = None) -> list[dict]:
        """Return merged note events; silence and non-pitched audio return []."""
        sr = sample_rate or self.sample_rate
        if signal.size < 2 or float(np.max(np.abs(signal))) < 1e-4:
            return []

        # Harmonic separation makes the dominant fundamental less sensitive to
        # drum transients while remaining independent of the chord classifier.
        harmonic = librosa.effects.harmonic(signal, margin=2.0)
        f0, voiced, probability = librosa.pyin(
            harmonic,
            fmin=float(librosa.note_to_hz("C2")),
            fmax=float(librosa.note_to_hz("C7")),
            sr=sr,
            frame_length=2048,
            hop_length=self.hop_length,
            center=True,
        )
        if f0 is None or not len(f0):
            return []

        rms = librosa.feature.rms(y=signal, frame_length=2048, hop_length=self.hop_length, center=True)[0]
        flatness = librosa.feature.spectral_flatness(y=signal, n_fft=2048, hop_length=self.hop_length, center=True)[0]
        count = min(len(f0), len(rms), len(flatness))
        f0, voiced, probability = f0[:count], voiced[:count], probability[:count]
        rms, flatness = rms[:count], flatness[:count]
        energy_floor = max(float(np.percentile(rms, 20)) * 0.4, float(np.max(rms)) * 0.015, 1e-5)

        midi_float = librosa.hz_to_midi(f0)
        # Median smoothing removes brief octave errors and vibrato/jitter before
        # semitone quantization. NaNs are restored rather than leaking pitches.
        filled = np.where(np.isfinite(midi_float), midi_float, 0.0)
        smoothed = median_filter(filled, size=3, mode="nearest")
        midi = np.rint(smoothed).astype(int)
        valid = (
            voiced
            & np.isfinite(f0)
            & (probability >= self.confidence_floor)
            & (rms >= energy_floor)
            & (flatness < 0.35)
            & (np.abs(midi_float - midi) <= 0.45)
        )
        labels: list[int | None] = [int(midi[i]) if valid[i] else None for i in range(count)]

        # Bridge one rejected frame only when both neighbours agree. This keeps
        # legato notes together without bridging genuine note changes or rests.
        for index in range(1, count - 1):
            if labels[index] is None and labels[index - 1] == labels[index + 1] and labels[index - 1] is not None:
                labels[index] = labels[index - 1]
                probability[index] = min(probability[index - 1], probability[index + 1])

        frame_seconds = self.hop_length / sr
        events: list[NoteEvent] = []
        index = 0
        while index < count:
            if labels[index] is None:
                index += 1
                continue
            end_index = index + 1
            while end_index < count and labels[end_index] == labels[index]:
                end_index += 1
            start = index * frame_seconds
            end = min(len(signal) / sr, end_index * frame_seconds)
            if end - start >= self.minimum_duration:
                note_midi = labels[index]
                assert note_midi is not None
                confidence = float(np.mean(probability[index:end_index]))
                events.append(NoteEvent(
                    note=str(librosa.midi_to_note(note_midi, unicode=False)),
                    midi=note_midi,
                    frequency=round(float(librosa.midi_to_hz(note_midi)), 2),
                    start=round(start, 3),
                    end=round(end, 3),
                    confidence=round(confidence, 3),
                ))
            index = end_index

        return [asdict(event) for event in events]
