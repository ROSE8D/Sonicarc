import { useRef, useState } from "react";
import { ArrowUpRight, Guitar, Piano } from "lucide-react";
import { adaptDetectedChords } from "../api/chordAdaptation";
import type { ChordAnalysis, ChordAdaptationResponse, AdaptationSkill } from "../types";

export type Instrument = "Guitar" | "Piano";
type Skill = "Beginner" | "Intermediate" | "Advanced";

interface Props {
  analysis: ChordAnalysis;
  instrument: Instrument;
  onInstrumentChange: (value: Instrument) => void;
}

export function PlayItYourself({ analysis, instrument, onInstrumentChange }: Props) {
  const [skill, setSkill] = useState<Skill>("Beginner");
  const [adaptation, setAdaptation] = useState<ChordAdaptationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdapting, setIsAdapting] = useState(false);
  const requestId = useRef(0);

  const clearAdaptation = () => {
    requestId.current += 1;
    setAdaptation(null);
    setError(null);
    setIsAdapting(false);
  };

  const adapt = async () => {
    const id = ++requestId.current;
    setAdaptation(null);
    setError(null);
    setIsAdapting(true);
    try {
      const result = await adaptDetectedChords(
        analysis,
        instrument.toLowerCase() as "guitar" | "piano",
        skill.toLowerCase() as AdaptationSkill,
      );
      if (id === requestId.current) setAdaptation(result);
    } catch (cause) {
      if (id === requestId.current) setError(cause instanceof Error ? cause.message : "We couldn't adapt this progression right now.");
    } finally {
      if (id === requestId.current) setIsAdapting(false);
    }
  };

  return (
    <section className="play-section" aria-labelledby="play-title">
      <div>
        <p className="eyebrow">Make it yours</p>
        <h2 id="play-title">Play it yourself</h2>
        <p>Choose how you play. We’ll reshape the detected progression without changing what the song gave us.</p>
      </div>
      <div className="choice-group">
        <span className="choice-label">Instrument</span>
        <div className="segmented" role="group" aria-label="Instrument">
          {(["Guitar", "Piano"] as Instrument[]).map(value => (
            <button key={value} aria-pressed={instrument === value} className={instrument === value ? "active" : ""} onClick={() => { clearAdaptation(); onInstrumentChange(value); }}>
              {value === "Guitar" ? <Guitar size={18} /> : <Piano size={18} />}{value}
            </button>
          ))}
        </div>
      </div>
      <div className="choice-group">
        <span className="choice-label">Skill level</span>
        <div className="segmented" role="group" aria-label="Skill level">
          {(["Beginner", "Intermediate", "Advanced"] as Skill[]).map(value => (
            <button key={value} aria-pressed={skill === value} className={skill === value ? "active" : ""} onClick={() => { clearAdaptation(); setSkill(value); }}>{value}</button>
          ))}
        </div>
      </div>
      <button className="adapt-button" onClick={adapt} disabled={isAdapting}>
        {isAdapting ? "Adapting…" : "Adapt for me"} {!isAdapting && <ArrowUpRight size={16} aria-hidden="true" />}
      </button>
      {isAdapting && <p className="integration-notice" role="status">Finding a playable path through your detected chords…</p>}
      {error && <p className="adaptation-error" role="alert">{error}</p>}
      {adaptation && (
        <div className="adaptation-result" aria-live="polite">
          <div className="adaptation-heading">
            <div><span>Your arrangement</span><strong>{instrument} · {skill}</strong></div>
            {(adaptation.transposeTo || adaptation.capo != null) && <p>{adaptation.transposeTo && `Transpose to ${adaptation.transposeTo}`}{adaptation.transposeTo && adaptation.capo != null && " · "}{adaptation.capo != null && `Capo ${adaptation.capo}`}</p>}
          </div>
          <p className="adaptation-summary">{adaptation.summary}</p>
          <ol className="adapted-chords">
            {adaptation.adaptedChords.map((chord, index) => (
              <li key={`${index}-${chord.original}`}>
                <div><span>{chord.original}</span><i aria-hidden="true">→</i><strong>{chord.adapted}</strong></div>
                <p>{chord.reason}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
