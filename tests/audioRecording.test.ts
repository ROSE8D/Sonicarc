import assert from "node:assert/strict";
import test from "node:test";
import { preferredRecordingMimeType, recordingExtension } from "../src/audioRecording";

test("prefers Chrome and Edge WebM/Opus and falls back to Safari MP4/AAC", () => {
  globalThis.MediaRecorder = { isTypeSupported: (type: string) => type.startsWith("audio/webm") } as typeof MediaRecorder;
  assert.equal(preferredRecordingMimeType(), "audio/webm;codecs=opus");

  globalThis.MediaRecorder = { isTypeSupported: (type: string) => type.startsWith("audio/mp4") } as typeof MediaRecorder;
  assert.equal(preferredRecordingMimeType(), "audio/mp4;codecs=mp4a.40.2");
});

test("uses an extension matching the actual MediaRecorder container", () => {
  assert.equal(recordingExtension("audio/webm;codecs=opus"), "webm");
  assert.equal(recordingExtension("audio/mp4;codecs=mp4a.40.2"), "m4a");
  assert.equal(recordingExtension("audio/ogg;codecs=opus"), "ogg");
});
