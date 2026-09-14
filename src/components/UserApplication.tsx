import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Mic, Square, Upload } from "lucide-react";
import type { ChordAnalysisResponse } from "../types";
import { ChordTimeline } from "./ChordTimeline";
import { NoteTimeline } from "./NoteTimeline";
import { PlayItYourself, type Instrument } from "./PlayItYourself";
import { Turntable } from "./Turntable";
import "../consumer.css";
import { preferredRecordingMimeType, recordingExtension } from "../audioRecording";

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
  const [isDragging, setIsDragging] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const dragDepth = useRef(0);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "SonicArc — From listening to playing";
    return () => { document.title = previousTitle; };
  }, []);

  useEffect(() => {
    if (!isRecording) return;
    const started = Date.now();
    setRecordingSeconds(0);
    const timer = window.setInterval(() => setRecordingSeconds(Math.floor((Date.now() - started) / 1000)), 250);
    return () => window.clearInterval(timer);
  }, [isRecording]);

  useEffect(() => () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach(track => track.stop());
  }, []);

  const selectFile = (file?: File) => {
    if (file && !isRecording && !isAnalyzing) {
      setRecordError(null);
      setSelectedChord(null);
      void analyze(file);
    }
  };
  const startRecording = async () => {
    setRecordError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setRecordError("Audio recording is not supported in this browser."); return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream; chunksRef.current = [];
      const preferredMime = preferredRecordingMimeType();
      const recorder = preferredMime ? new MediaRecorder(stream, { mimeType: preferredMime }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = event => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        // recorder.mimeType describes the container actually emitted (including
        // its codec); never label these encoded bytes as WAV.
        const mime = recorder.mimeType || chunksRef.current[0]?.type || preferredMime || "application/octet-stream";
        const extension = recordingExtension(mime);
        const blob = new Blob(chunksRef.current, { type: mime });
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        if (blob.size) void analyze(new File([blob], `sonicarc-recording.${extension}`, { type: mime }));
      };
      recorder.start(); setIsRecording(true);
    } catch { setRecordError("Microphone access was unavailable. Check your browser permission and try again."); }
  };
  const stopRecording = () => { recorderRef.current?.stop(); setIsRecording(false); };

  const hasError = Boolean(error || recordError);
  const activeChord = selectedChord != null ? result?.analysis.chords[selectedChord] : null;
  const turntableState = isAnalyzing ? "loading" : result ? "success" : isRecording ? "recording" : hasError ? "error" : "idle";
  const statusText = isAnalyzing ? "Listening closely" : result ? "Analysis complete" : isRecording ? "Recording audio" : hasError ? "Ready to try again" : "Ready when you are";

  return (
    <div className="user-app">
      <a className="skip-link" href="#listening-desk">Skip to the listening desk</a>
      <header className="user-nav">
        <a href="/" className="brand" aria-label="SonicArc home">
          <svg className="brand-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <path d="M5 30V20a15 15 0 0 1 30 0v10M11 30V20a9 9 0 0 1 18 0v10M17 30V20a3 3 0 0 1 6 0v10" stroke="currentColor" strokeWidth="3" />
          </svg>
          <span>sonicarc<span className="brand-period">.</span></span>
        </a>
        <p className="nav-manifesto">Hear it. Understand it. Play it.</p>
        <a href="/dev" className="dev-link">Developer dashboard <ArrowUpRight size={14} aria-hidden="true" /></a>
      </header>

      <main>
        <section className={`session-intro ${result ? "has-result" : ""}`}>
          <div>
            <p className="eyebrow"><span className="index-number">S / A</span> {result ? "Your song map" : "From listening to playing"}</p>
            <h1>{result ? result.filename : <>Turn any song into<br /><em>something you can play.</em></>}</h1>
          </div>
          {result ? (
            <button className="back-button" onClick={() => { setSelectedChord(null); reset(); }}><ArrowLeft size={16} aria-hidden="true" /> Analyze another song</button>
          ) : (
            <p className="intro-description">Upload a track or capture an idea.<br /> SonicArc maps the chords and timing so you can move from listening to playing.</p>
          )}
        </section>

        <section
          id="listening-desk"
          tabIndex={-1}
          className={`listening-desk state-${turntableState} ${isDragging ? "is-dragging" : ""}`}
          aria-label="Listening desk"
          aria-busy={isAnalyzing}
          onDragEnter={event => { event.preventDefault(); if (!result && !isAnalyzing && !isRecording) { dragDepth.current++; setIsDragging(true); } }}
          onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = isRecording || isAnalyzing || result ? "none" : "copy"; }}
          onDragLeave={event => { event.preventDefault(); dragDepth.current = Math.max(0, dragDepth.current - 1); if (!dragDepth.current) setIsDragging(false); }}
          onDrop={event => { event.preventDefault(); dragDepth.current = 0; setIsDragging(false); if (!result) selectFile(event.dataTransfer.files[0]); }}
        >
          <div className="desk-bar">
            <span className="desk-title">The listening desk</span>
            <span className="session-status" role="status"><i aria-hidden="true" />{statusText}</span>
          </div>

          <div className="record-side">
            <div className="record-caption"><span>SONICARC / CHORD STUDY</span><span>01 — {result ? "MAPPED" : isRecording ? "REC" : "AUDIO"}</span></div>
            <Turntable state={turntableState} />
            <div className="record-footnote"><span>{isRecording ? "Capturing your idea" : isAnalyzing ? "Finding the harmony in your audio" : result ? "A little closer to the music" : "Every song has a way in"}</span><span className="record-signature" aria-hidden="true">sa.</span></div>
          </div>

          <div className="desk-readout">
            {!result && !isAnalyzing && (
              <div className="input-panel">
                <p className="eyebrow"><span className="index-number">01</span> {isRecording ? "Capture an idea" : "Start with a sound"}</p>
                <h2>{isRecording ? <>Your idea.<br /><em>On the record.</em></> : <>A song you love.<br /><em>An idea of your own.</em></>}</h2>
                <p className="input-description">{isRecording ? "Play, sing, or let the music in. Stop when you’re ready to find the chords." : "Bring the music. We’ll find the chords."}</p>
                {isRecording && <div className="recording-time" aria-label={`${recordingSeconds} seconds recorded`}><i aria-hidden="true" />{formatDuration(recordingSeconds)}<span>REC</span></div>}
                <div className="input-actions">
                  {!isRecording && <button className="primary-action" onClick={() => inputRef.current?.click()}><Upload size={19} aria-hidden="true" /><span>Upload a song</span><ArrowUpRight size={20} aria-hidden="true" /></button>}
                  <button className={`secondary-action ${isRecording ? "recording" : ""}`} onClick={isRecording ? stopRecording : startRecording}>
                    {isRecording ? <Square size={16} fill="currentColor" aria-hidden="true" /> : <Mic size={18} aria-hidden="true" />}<span>{isRecording ? "Stop & analyze" : "Record audio"}</span>
                  </button>
                </div>
                {!isRecording && <p className="formats">Or drop your audio onto the desk.<br /><span>WAV, MP3, FLAC, M4A, AAC or OGG</span></p>}
                {hasError && <div className="user-error" role="alert">{error || recordError}</div>}
              </div>
            )}

            {isAnalyzing && (
              <div className="analysis-panel">
                <p className="eyebrow"><span className="index-number">02</span> Finding the chords</p>
                <h2>Listening<br /><em>closely.</em></h2>
                <p className="analysis-filename">{sourceFile?.name || "Your audio"}</p>
                <div className="analysis-meter" aria-hidden="true"><span /></div>
                <p className="input-description">Mapping the harmony, rhythm,<br />and all the changes in between.</p>
                <p className="analysis-note">Analyzing your song…</p>
              </div>
            )}

            {result && (
              <div className="result-panel">
                <p className="eyebrow"><span className="index-number">02</span> {activeChord ? "Selected chord" : "Your song, decoded"}</p>
                <div className="chord-readout" key={activeChord ? selectedChord : "key"}>
                  <span className="readout-label">{activeChord ? `${formatDuration(activeChord.start)} — ${formatDuration(activeChord.end)}` : "Detected key"}</span>
                  <h2>{activeChord?.chord || result.analysis.key}</h2>
                  <p>{activeChord ? `${Math.round(activeChord.confidence * 100)}% confidence` : `${result.analysis.chords.length} detected chord regions`}</p>
                </div>
                <dl className="song-stats">
                  <div><dt>Key</dt><dd>{result.analysis.key}</dd></div>
                  {result.analysis.bpm != null && <div><dt>Tempo</dt><dd>{Math.round(result.analysis.bpm)} <small>BPM</small></dd></div>}
                  {result.analysis.duration != null && <div><dt>Length</dt><dd>{formatDuration(result.analysis.duration)}</dd></div>}
                </dl>
                <p className="readout-hint">Select a chord below to take a closer look.</p>
              </div>
            )}
          </div>
          {isDragging && <div className="drop-overlay"><Upload size={32} aria-hidden="true" /><strong>Drop it. Let’s hear it.</strong><span>Release your audio to find the chords.</span></div>}
        </section>
        <input ref={inputRef} type="file" aria-label="Upload audio file" accept="audio/*,.wav,.mp3,.flac,.m4a,.aac,.ogg" hidden onChange={event => { selectFile(event.target.files?.[0]); event.target.value = ""; }} />

        {result ? (
          <div className="results-page">
            <section className="progression-section" aria-labelledby="progression-title">
              <div className="section-heading"><div><p className="eyebrow">The chord progression</p><h2 id="progression-title">Follow the song.</h2></div><p>Start to finish <span aria-hidden="true">↗</span></p></div>
              <ChordTimeline chords={result.analysis.chords} duration={result.analysis.duration} selectedIndex={selectedChord} onSelect={setSelectedChord} />
              {activeChord && <div className="chord-detail"><strong>{activeChord.chord}</strong><p>{Math.round(activeChord.confidence * 100)}% confidence · {instrument} fingering guidance will appear here in a future update.</p></div>}
            </section>
            <section className="melody-section" aria-labelledby="melody-title">
              <div className="section-heading"><div><p className="eyebrow">Melody / Notes</p><h2 id="melody-title">Hear every line.</h2></div><p>{result.analysis.notes.length} reliable note events <span aria-hidden="true">↗</span></p></div>
              <NoteTimeline notes={result.analysis.notes} duration={result.analysis.duration} />
            </section>
            <PlayItYourself analysis={result.analysis} instrument={instrument} onInstrumentChange={setInstrument} />
          </div>
        ) : (
          <ol className="session-guide" aria-label="How SonicArc works">
            <li className={!isAnalyzing ? "current" : ""}><span>01</span><div><strong>Bring a sound.</strong><p>Upload a song or record an idea.</p></div></li>
            <li className={isAnalyzing ? "current" : ""}><span>02</span><div><strong>Find the changes.</strong><p>See the chords, key, and timing.</p></div></li>
            <li><span>03</span><div><strong>Make it yours.</strong><p>Move from listening to playing.</p></div></li>
          </ol>
        )}
      </main>
      <footer className="user-footer"><span>SONICARC — FROM SOUND TO STRINGS.</span><span>A little closer to the music.<span className="footer-arc" aria-hidden="true"> ↗</span></span></footer>
    </div>
  );
}
