from io import BytesIO
from pathlib import Path
import subprocess
import tempfile

import imageio_ffmpeg
import numpy as np
import soundfile as sf

from backend.app import app
from backend.chord_analysis import ChordAnalysisError, ChordAnalyzer


def synthesize_progression() -> bytes:
    sample_rate = 22050
    parts = []
    for midi_notes in ((60, 64, 67), (67, 71, 74), (69, 72, 76)):
        time = np.arange(sample_rate * 2) / sample_rate
        chord = sum(np.sin(2 * np.pi * 440 * 2 ** ((note - 69) / 12) * time) for note in midi_notes)
        envelope = np.minimum(time * 20, 1) * np.minimum((2 - time) * 20, 1)
        parts.append(0.15 * chord * envelope)
    output = BytesIO()
    sf.write(output, np.concatenate(parts), sample_rate, format="WAV", subtype="PCM_16")
    return output.getvalue()


def synthesize_browser_recording() -> bytes:
    """Encode the same real signal as Chrome/Edge MediaRecorder WebM/Opus."""
    with tempfile.TemporaryDirectory() as directory:
        wav_path = Path(directory) / "source.wav"
        webm_path = Path(directory) / "recording.webm"
        wav_path.write_bytes(synthesize_progression())
        subprocess.run(
            [imageio_ffmpeg.get_ffmpeg_exe(), "-v", "error", "-y", "-i", str(wav_path), "-c:a", "libopus", str(webm_path)],
            check=True,
        )
        return webm_path.read_bytes()


def test_analyzer_returns_real_timed_chords_and_key():
    result = ChordAnalyzer().analyze_bytes(synthesize_progression())

    detected = {segment["chord"] for segment in result["chords"] if segment["chord"] != "N"}
    assert "C Major" in detected
    assert "G Major" in detected
    assert result["key"]
    assert result["duration"] == 6.0
    assert all(segment["start"] < segment["end"] for segment in result["chords"])
    assert result["chords"] == sorted(result["chords"], key=lambda segment: segment["start"])


def test_silence_is_not_given_fake_chords():
    output = BytesIO()
    sf.write(output, np.zeros(22050), 22050, format="WAV")
    try:
        ChordAnalyzer().analyze_bytes(output.getvalue())
    except ChordAnalysisError as exc:
        assert "No audible signal" in str(exc)
    else:
        raise AssertionError("silent audio should fail analysis")


def test_chord_endpoint_accepts_multipart_audio():
    client = app.test_client()
    response = client.post(
        "/api/analyze-chords",
        data={"file": (BytesIO(synthesize_progression()), "progression.wav")},
        content_type="multipart/form-data",
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["filename"] == "progression.wav"
    assert payload["analysis"]["method"] == "harmonic-cqt-template-v1"
    assert payload["analysis"]["chords"]


def test_chord_endpoint_decodes_browser_webm_opus(caplog):
    client = app.test_client()
    with caplog.at_level("INFO"):
        response = client.post(
            "/api/analyze-chords",
            data={"file": (BytesIO(synthesize_browser_recording()), "sonicarc-recording.webm", "audio/webm;codecs=opus")},
            content_type="multipart/form-data",
        )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["filename"] == "sonicarc-recording.webm"
    assert payload["mime_type"].startswith("audio/webm")
    assert payload["analysis"]["method"] == "harmonic-cqt-template-v1"
    assert "filename=sonicarc-recording.webm" in caplog.text
    assert "format=webm" in caplog.text
    assert "decoded_format=wav/pcm_s16le" in caplog.text


def test_chord_endpoint_rejects_missing_audio():
    response = app.test_client().post("/api/analyze-chords", json={})
    assert response.status_code == 400
    assert response.get_json()["error"] == "An audio file is required."
