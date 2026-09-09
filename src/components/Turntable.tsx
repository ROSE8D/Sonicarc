import { Music2 } from "lucide-react";

export type TurntableState = "idle" | "loading" | "success" | "error";

interface Props {
  state: TurntableState;
  compact?: boolean;
}

const waveBars = [34, 62, 45, 78, 52, 88, 58, 72, 40, 66, 32];

export function Turntable({ state, compact = false }: Props) {
  const status = state === "loading"
    ? "Audio is being analyzed"
    : state === "success"
      ? "Analysis complete"
      : state === "error"
        ? "Turntable ready to try again"
        : "Turntable ready for audio";

  return (
    <div className={`turntable-stage is-${state} ${compact ? "is-compact" : ""}`} role="img" aria-label={status}>
      <div className="turntable-shadow" aria-hidden="true" />
      <div className="turntable-deck" aria-hidden="true">
        <div className="platter-rim">
          <div className="platter-mat" />
          <div className="vinyl">
            <div className="vinyl-grooves" />
            <div className="vinyl-label"><Music2 size={compact ? 12 : 22} strokeWidth={1.8} /></div>
          </div>
          <span className="spindle" />
        </div>
        <div className="tonearm">
          <span className="tonearm-pivot" />
          <span className="tonearm-bar" />
          <span className="tonearm-head" />
        </div>
        <div className="deck-controls">
          <span className="power-light" />
          <span className="speed-switch" />
        </div>
      </div>
      {state === "loading" && (
        <div className="turntable-wave" aria-hidden="true">
          {waveBars.map((height, index) => <i key={index} style={{ height: `${height}%`, animationDelay: `${index * -75}ms` }} />)}
        </div>
      )}
    </div>
  );
}
