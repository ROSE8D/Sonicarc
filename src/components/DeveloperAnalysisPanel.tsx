import { useRef } from "react";
import { FileJson, Upload } from "lucide-react";
import type { ChordAnalysisResponse } from "../types";

interface Props { result: ChordAnalysisResponse | null; isAnalyzing: boolean; error: string | null; analyze: (file: File) => Promise<void>; }
export function DeveloperAnalysisPanel({ result, isAnalyzing, error, analyze }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  return <section className="dev-panel" id="audio-debug"><div className="dev-section-title"><div><span className="dev-kicker">Real endpoint output</span><h2>Audio analysis debug view</h2></div><button className="dev-action" onClick={() => inputRef.current?.click()}><Upload size={15} /> {isAnalyzing ? "Analyzing…" : "Analyze audio"}</button><input ref={inputRef} hidden type="file" accept="audio/*" onChange={e => { if (e.target.files?.[0]) void analyze(e.target.files[0]); e.target.value = ""; }} /></div>
    {error && <p className="dev-error">{error}</p>}
    {!result && !isAnalyzing && <div className="dev-empty">Submit an audio file to inspect the chord engine's real response.</div>}
    {isAnalyzing && <div className="dev-empty">Waiting for the Python audio backend…</div>}
    {result && <><div className="metric-grid"><div><span>File</span><strong>{result.filename}</strong></div><div><span>Key</span><strong>{result.analysis.key}</strong><small>{result.analysis.key_confidence != null ? `${Math.round(result.analysis.key_confidence * 100)}% confidence` : "Confidence unavailable"}</small></div><div><span>BPM</span><strong>{result.analysis.bpm ?? "Unavailable"}</strong><small>{result.analysis.bpm_confidence != null ? `${Math.round(result.analysis.bpm_confidence * 100)}% confidence` : "Confidence unavailable"}</small></div><div><span>Duration</span><strong>{result.analysis.duration.toFixed(2)}s</strong></div></div>
    <div className="debug-table-wrap"><table className="debug-table"><thead><tr><th>#</th><th>Chord</th><th>Start</th><th>End</th><th>Confidence</th></tr></thead><tbody>{result.analysis.chords.map((chord, index) => <tr key={`${chord.start}-${index}`}><td>{index + 1}</td><td>{chord.chord}</td><td>{chord.start.toFixed(2)}s</td><td>{chord.end.toFixed(2)}s</td><td>{(chord.confidence * 100).toFixed(1)}%</td></tr>)}</tbody></table></div>
    <div className="json-heading"><FileJson size={17} /><h3>Raw API / JSON view</h3></div><pre className="json-view">{JSON.stringify(result, null, 2)}</pre></>}
  </section>;
}
