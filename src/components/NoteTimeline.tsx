import type { CSSProperties } from "react";
import type { NoteEvent } from "../types";

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(2).padStart(5, "0")}`;

export function NoteTimeline({ notes, duration }: { notes: NoteEvent[]; duration: number }) {
  if (!notes.length) return <p className="notes-empty">No reliable dominant melody notes were found in this recording.</p>;
  return <div className="note-timeline" aria-label="Chronological detected melody notes">
    {notes.map((event, index) => {
      const left = duration ? event.start / duration * 100 : 0;
      const width = duration ? Math.max((event.end - event.start) / duration * 100, 1.5) : 2;
      return <div className="note-event" key={`${event.start}-${event.midi}-${index}`} style={{ "--note-left": `${left}%`, "--note-width": `${width}%` } as CSSProperties}>
        <strong>{event.note}</strong>
        <span>{formatTime(event.start)} · {(event.end - event.start).toFixed(2)}s</span>
        <small>{Math.round(event.confidence * 100)}%</small>
      </div>;
    })}
  </div>;
}
