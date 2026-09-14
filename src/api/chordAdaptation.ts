import type { ChordAnalysis, ChordAdaptationResponse, AdaptationInstrument, AdaptationSkill } from "../types";

export async function adaptDetectedChords(
  analysis: ChordAnalysis,
  instrument: AdaptationInstrument,
  skillLevel: AdaptationSkill,
): Promise<ChordAdaptationResponse> {
  const response = await fetch("/api/adapt-chords", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instrument,
      skillLevel,
      detectedChords: analysis.chords.map(({ chord, start, end }) => ({ chord, start, end })),
      detectedKey: analysis.key || null,
      bpm: analysis.bpm,
    }),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
      ? payload.error : "We couldn't adapt this progression right now.";
    throw new Error(message);
  }
  return payload as ChordAdaptationResponse;
}
