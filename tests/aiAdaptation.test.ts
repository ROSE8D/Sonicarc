import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAdaptationPrompt,
  validateAdaptationRequest,
  validateAdaptationResponse,
} from "../aiAdaptation";

const request = validateAdaptationRequest({
  instrument: "guitar",
  skillLevel: "beginner",
  detectedChords: [
    { chord: "Dm7", start: 0, end: 2 },
    { chord: "G7", start: 2, end: 4 },
  ],
  detectedKey: "C Major",
  bpm: 108,
});

test("accepts a valid structured adaptation request", () => {
  assert.ok(request);
  assert.match(buildAdaptationPrompt(request), /MUST NOT analyze audio/);
});

test("rejects invalid chord events", () => {
  assert.equal(validateAdaptationRequest({ instrument: "guitar", skillLevel: "beginner", detectedChords: [] }), null);
  assert.equal(validateAdaptationRequest({
    instrument: "violin",
    skillLevel: "beginner",
    detectedChords: [{ chord: "C", start: 0, end: 1 }],
  }), null);
});

test("accepts output only when every original chord matches in order", () => {
  assert.ok(request);
  const result = validateAdaptationResponse({
    adaptedChords: [
      { original: "Dm7", adapted: "Dm", reason: "Easier open shape" },
      { original: "G7", adapted: "G7", reason: "Already practical" },
    ],
    transposeTo: null,
    capo: null,
    summary: "A simpler version.",
  }, request);
  assert.deepEqual(result?.adaptedChords.map(chord => chord.original), ["Dm7", "G7"]);

  assert.equal(validateAdaptationResponse({
    adaptedChords: [
      { original: "Am", adapted: "Am", reason: "Invented" },
      { original: "G7", adapted: "G7", reason: "Same" },
    ],
    transposeTo: null,
    capo: null,
    summary: "Invalid.",
  }, request), null);
});

test("rejects capo recommendations for piano", () => {
  const pianoRequest = { ...request!, instrument: "piano" as const };
  assert.equal(validateAdaptationResponse({
    adaptedChords: [
      { original: "Dm7", adapted: "Dm7", reason: "Playable voicing" },
      { original: "G7", adapted: "G7", reason: "Playable voicing" },
    ],
    transposeTo: null,
    capo: 2,
    summary: "Invalid piano capo.",
  }, pianoRequest), null);
});
