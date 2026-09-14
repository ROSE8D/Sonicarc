from io import BytesIO

import numpy as np
import soundfile as sf

from backend.chord_analysis import ChordAnalyzer
from backend.pitch_analysis import PitchAnalyzer

SR = 22050


def tone(midi: int, duration: float, amplitude: float = 0.4) -> np.ndarray:
    count = int(SR * duration)
    time = np.arange(count) / SR
    envelope = np.minimum(time * 40, 1) * np.minimum((duration - time) * 40, 1)
    frequency = 440 * 2 ** ((midi - 69) / 12)
    return amplitude * np.sin(2 * np.pi * frequency * time) * envelope


def wav(signal: np.ndarray) -> bytes:
    output = BytesIO()
    sf.write(output, signal, SR, format="WAV", subtype="PCM_16")
    return output.getvalue()


def test_clean_single_note_becomes_one_event():
    events = PitchAnalyzer().analyze(tone(69, 1.0), SR)
    assert len(events) == 1
    assert events[0]["note"] == "A4"
    assert events[0]["midi"] == 69
    assert events[0]["frequency"] == 440.0
    assert events[0]["end"] - events[0]["start"] > 0.8


def test_ascending_and_descending_scale_is_chronological_and_merged():
    notes = [60, 62, 64, 65, 67, 65, 64, 62, 60]
    events = PitchAnalyzer().analyze(np.concatenate([tone(note, 0.24) for note in notes]), SR)
    detected = [event["midi"] for event in events]
    assert detected == notes
    assert all(event["start"] < event["end"] for event in events)
    assert events == sorted(events, key=lambda event: event["start"])


def test_dominant_melody_over_quiet_accompaniment():
    melody = np.concatenate([tone(note, 0.45) for note in (69, 71, 72)])
    time = np.arange(len(melody)) / SR
    accompaniment = 0.025 * sum(np.sin(2 * np.pi * 440 * 2 ** ((note - 69) / 12) * time) for note in (48, 52, 55))
    events = PitchAnalyzer().analyze(melody + accompaniment, SR)
    assert [event["midi"] for event in events] == [69, 71, 72]


def test_silence_and_noise_do_not_produce_note_events():
    analyzer = PitchAnalyzer()
    assert analyzer.analyze(np.zeros(SR), SR) == []
    noise = np.random.default_rng(42).normal(0, 0.1, SR)
    assert analyzer.analyze(noise, SR) == []


def test_existing_chord_result_is_preserved_and_notes_are_added():
    duration = 2.0
    signal = sum(tone(note, duration, 0.15) for note in (60, 64, 67))
    result = ChordAnalyzer().analyze_bytes(wav(signal))
    assert any(segment["chord"] == "C Major" for segment in result["chords"])
    assert result["method"] == "harmonic-cqt-template-v1"
    assert result["note_method"] == "pyin-dominant-pitch-v1"
    assert isinstance(result["notes"], list)
