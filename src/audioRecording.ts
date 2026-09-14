const RECORDING_TYPES = [
  "audio/webm;codecs=opus",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/ogg;codecs=opus",
] as const;

/** Pick an explicit encoding rather than relying on a browser-specific default. */
export function preferredRecordingMimeType(): string | undefined {
  return RECORDING_TYPES.find(type => MediaRecorder.isTypeSupported(type));
}

/** Map the MediaRecorder's actual output type to a filename the server can trust. */
export function recordingExtension(mimeType: string): string {
  const container = mimeType.toLowerCase().split(";", 1)[0];
  if (container === "audio/mp4") return "m4a";
  if (container === "audio/ogg") return "ogg";
  if (container === "audio/webm") return "webm";
  if (container === "audio/wav") return "wav";
  return "audio";
}
