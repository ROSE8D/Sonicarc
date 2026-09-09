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
              style={{ flexBasis: `${width}%` }}
              onClick={() => onSelect(index)}
              key={`${segment.start}-${segment.chord}-${index}`}
              aria-pressed={selectedIndex === index}
            >
              <strong>{segment.chord}</strong>
              <span>{formatTime(segment.start)}</span>
              <small>{Math.round(segment.confidence * 100)}% confidence</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}
