import type { ChordAnalysisResponse } from "../types";

export async function analyzeChordAudio(file: File): Promise<ChordAnalysisResponse> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/analyze-chords", { method: "POST", body });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "We couldn't analyze that audio file.");
  return payload as ChordAnalysisResponse;
}
