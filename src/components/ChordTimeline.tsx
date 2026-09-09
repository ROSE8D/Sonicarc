import type { CSSProperties } from "react";
import type { ChordSegment } from "../types";

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
};

interface Props {
  chords: ChordSegment[];
  duration: number;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export function ChordTimeline({ chords, duration, selectedIndex, onSelect }: Props) {
  return (
    <div className="timeline-wrap">
      <div className="timeline" aria-label="Chronological chord progression">
        {chords.map((segment, index) => {
          const width = duration > 0 ? Math.max(((segment.end - segment.start) / duration) * 100, 6) : 10;
          return (
            <button
              type="button"
              className={`chord-segment ${selectedIndex === index ? "is-selected" : ""}`}
              style={{ flexBasis: `${width}%`, "--chord-index": index } as CSSProperties}
              onClick={() => onSelect(index)}
              key={`${segment.start}-${segment.chord}-${index}`}
              aria-pressed={selectedIndex === index}
            >
              <span className="segment-number" aria-hidden="true">{(index + 1).toString().padStart(2, "0")}</span>
              <strong>{segment.chord}</strong>
              <span className="segment-time">{formatTime(segment.start)} — {formatTime(segment.end)}</span>
              <small>{Math.round(segment.confidence * 100)}% confidence</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}
