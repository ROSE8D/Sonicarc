import { useRef, useState } from "react";
import { ArrowLeft, Mic, Music2, Square, Upload } from "lucide-react";
import type { ChordAnalysisResponse } from "../types";
import { ChordTimeline } from "./ChordTimeline";
import { PlayItYourself, type Instrument } from "./PlayItYourself";
import { Turntable } from "./Turntable";

interface Props {
  result: ChordAnalysisResponse | null;
  isAnalyzing: boolean;
  error: string | null;
  analyze: (file: File) => Promise<void>;
  reset: () => void;
  sourceFile?: File | null;
}

const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;

export function UserApplication({ result, sourceFile, isAnalyzing, error, analyze, reset }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [selectedChord, setSelectedChord] = useState<number | null>(null);
  const [instrument, setInstrument] = useState<Instrument>("Guitar");

  const selectFile = (file?: File) => { if (file) void analyze(file); };
  const startRecording = async () => {
    setRecordError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setRecordError("Audio recording is not supported in this browser."); return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream; chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = event => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const mime = recorder.mimeType || "audio/webm";
        const extension = mime.includes("ogg") ? "ogg" : mime.includes("mp4") ? "m4a" : "webm";
        const blob = new Blob(chunksRef.current, { type: mime });
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        if (blob.size) void analyze(new File([blob], `sonicarc-recording.${extension}`, { type: mime }));
      };
      recorder.start(); setIsRecording(true);
    } catch { setRecordError("Microphone access was unavailable. Check your browser permission and try again."); }
  };
  const stopRecording = () => { recorderRef.current?.stop(); setIsRecording(false); };

  return (
    <div className="user-app">
      <header className="user-nav">
        <a href="/" className="brand"><span className="brand-mark"><Music2 size={20} /></span>SONICARC</a>
        <a href="/dev" className="dev-link">Developer dashboard</a>
      </header>

      <main>
        {!result && !isAnalyzing && (
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">Hear it. Understand it. Play it.</p>
              <h1>Turn any song into<br /><em>something you can play.</em></h1>
              <p className="hero-description">Upload a track or capture an idea. SonicArc maps the chords and timing so you can move from listening to playing.</p>
              <div className="hero-actions">
                <button className="primary-action" onClick={() => inputRef.current?.click()}><Upload size={20} /> Upload a song</button>
                <button className={`secondary-action ${isRecording ? "recording" : ""}`} onClick={isRecording ? stopRecording : startRecording}>
                  {isRecording ? <Square size={18} /> : <Mic size={20} />}{isRecording ? "Stop & analyze" : "Record audio"}
                </button>
              </div>
              <input ref={inputRef} type="file" accept="audio/*,.wav,.mp3,.flac,.m4a,.aac,.ogg" hidden onChange={event => { selectFile(event.target.files?.[0]); event.target.value = ""; }} />
              <p className="formats">WAV, MP3, FLAC, M4A, AAC or OGG</p>
              {(error || recordError) && <div className="user-error" role="alert">{error || recordError}</div>}
            </div>
            <div className="hero-art"><Turntable state={error || recordError ? "error" : "idle"} /></div>
          </section>
        )}

        {isAnalyzing && (
          <section className="analysis-state" aria-live="polite">
            <Turntable state="loading" />
            <h1>Analyzing your song...</h1>
            <p>{sourceFile?.name ? <>Listening closely to <strong>{sourceFile.name}</strong>.</> : "Listening for harmony, rhythm, and chord changes."}</p>
          </section>
        )}

        {result && (
          <div className="results-page">
            <button className="back-button" onClick={() => { setSelectedChord(null); reset(); }}><ArrowLeft size={17} /> Analyze another song</button>
            <section className="result-header">
              <div className="result-turntable"><Turntable state="success" compact /></div>
              <div><p className="eyebrow">Your song map</p><h1>{result.filename}</h1></div>
              <dl className="song-stats">
                <div><dt>Key</dt><dd>{result.analysis.key}</dd></div>
                {result.analysis.bpm != null && <div><dt>Tempo</dt><dd>{Math.round(result.analysis.bpm)} <small>BPM</small></dd></div>}
                {result.analysis.duration != null && <div><dt>Length</dt><dd>{formatDuration(result.analysis.duration)}</dd></div>}
              </dl>
            </section>
            <section className="progression-section">
              <div className="section-heading"><div><p className="eyebrow">Chord progression</p><h2>Follow the song from start to finish</h2></div><p>{result.analysis.chords.length} detected regions</p></div>
              <ChordTimeline chords={result.analysis.chords} duration={result.analysis.duration} selectedIndex={selectedChord} onSelect={setSelectedChord} />
              {selectedChord != null && result.analysis.chords[selectedChord] && (
                <div className="chord-detail"><div><span>Selected chord</span><strong>{result.analysis.chords[selectedChord].chord}</strong></div><p>{Math.round(result.analysis.chords[selectedChord].confidence * 100)}% confidence · {instrument} fingering guidance will appear here in a future update.</p></div>
              )}
            </section>
            <PlayItYourself instrument={instrument} onInstrumentChange={setInstrument} />
          </div>
        )}
      </main>
      <footer className="user-footer"><span>SONICARC</span><span>From sound to strings.</span></footer>
    </div>
  );
}
