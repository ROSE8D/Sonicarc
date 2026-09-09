import { useState } from "react";
import { Guitar, Piano, Sparkles } from "lucide-react";

export type Instrument = "Guitar" | "Piano";
type Skill = "Beginner" | "Intermediate" | "Advanced";

interface Props { instrument: Instrument; onInstrumentChange: (value: Instrument) => void; }

export function PlayItYourself({ instrument, onInstrumentChange }: Props) {
  const [skill, setSkill] = useState<Skill>("Beginner");
  const [notice, setNotice] = useState(false);
  return (
    <section className="play-section" aria-labelledby="play-title">
      <div>
        <p className="eyebrow">Make it yours</p>
        <h2 id="play-title">Play it yourself</h2>
        <p>Choose how you play. Personalized arrangements will connect here when the adaptation service is ready.</p>
      </div>
      <div className="choice-group">
        <span className="choice-label">Instrument</span>
        <div className="segmented">
          {(["Guitar", "Piano"] as Instrument[]).map(value => (
            <button key={value} className={instrument === value ? "active" : ""} onClick={() => onInstrumentChange(value)}>
              {value === "Guitar" ? <Guitar size={18} /> : <Piano size={18} />}{value}
            </button>
          ))}
        </div>
      </div>
      <div className="choice-group">
        <span className="choice-label">Skill level</span>
        <div className="segmented">
          {(["Beginner", "Intermediate", "Advanced"] as Skill[]).map(value => (
            <button key={value} className={skill === value ? "active" : ""} onClick={() => setSkill(value)}>{value}</button>
          ))}
        </div>
      </div>
      <button className="adapt-button" onClick={() => setNotice(true)}><Sparkles size={18} /> Adapt for me</button>
      {notice && <p className="integration-notice" role="status">Personalized arrangements are coming soon. Your choices are ready for the future integration.</p>}
    </section>
  );
}
