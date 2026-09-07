import React, { useState, useEffect, useRef } from "react";
import { Mic, Play, Square, Info, Shield, Music, Zap, Layers } from "lucide-react";

// Chord Fingering structures for live 2D drawing (fretboard and keyboard)
interface FingerPosition {
  string: number; // 1 (High E) to 6 (Low E)
  fret: number;   // 0 for open, number for fret
  finger?: string; // 1, 2, 3, 4
}

interface PianoKey {
  note: string;
  isBlack: boolean;
  midiIndex: number;
}

const CHORD_LIBRARY: Record<string, {
  name: string;
  guitar: FingerPosition[];
  piano: string[]; // notes on keyboard
  notesInfo: string;
}> = {
  "C Major": {
    name: "C Major (I - Tonic)",
    guitar: [
      { string: 1, fret: 0 },
      { string: 2, fret: 1, finger: "1" },
      { string: 3, fret: 0 },
      { string: 4, fret: 2, finger: "2" },
      { string: 5, fret: 3, finger: "3" },
      { string: 6, fret: -1 } // muted
    ],
    piano: ["C", "E", "G"],
    notesInfo: "C - E - G (Root - Major 3rd - Perfect 5th)"
  },
  "A Minor": {
    name: "A Minor (vi - Submediant)",
    guitar: [
      { string: 1, fret: 0 },
      { string: 2, fret: 1, finger: "1" },
      { string: 3, fret: 2, finger: "3" },
      { string: 4, fret: 2, finger: "2" },
      { string: 5, fret: 0 },
      { string: 6, fret: -1 }
    ],
    piano: ["A", "C", "E"],
    notesInfo: "A - C - E (Root - Minor 3rd - Perfect 5th)"
  },
  "F Major": {
    name: "F Major (IV - Subdominant)",
    guitar: [
      { string: 1, fret: 1, finger: "1" },
      { string: 2, fret: 1, finger: "1" },
      { string: 3, fret: 2, finger: "2" },
      { string: 4, fret: 3, finger: "4" },
      { string: 5, fret: 3, finger: "3" },
      { string: 6, fret: 1, finger: "1" }
    ],
    piano: ["F", "A", "C"],
    notesInfo: "F - A - C (Root - Major 3rd - Perfect 5th)"
  },
  "G Major": {
    name: "G Major (V - Dominant)",
    guitar: [
      { string: 1, fret: 3, finger: "4" },
      { string: 2, fret: 0 },
      { string: 3, fret: 0 },
      { string: 4, fret: 0 },
      { string: 5, fret: 2, finger: "1" },
      { string: 6, fret: 3, finger: "2" }
    ],
    piano: ["G", "B", "D"],
    notesInfo: "G - B - D (Root - Major 3rd - Perfect 5th)"
  },
  "E Minor": {
    name: "E Minor (iii - Mediant)",
    guitar: [
      { string: 1, fret: 0 },
      { string: 2, fret: 0 },
      { string: 3, fret: 0 },
      { string: 4, fret: 2, finger: "3" },
      { string: 5, fret: 2, finger: "2" },
      { string: 6, fret: 0 }
    ],
    piano: ["E", "G", "B"],
    notesInfo: "E - G - B (Root - Minor 3rd - Perfect 5th)"
  },
  "D Major": {
    name: "D Major (II - Secondary Dominant)",
    guitar: [
      { string: 1, fret: 2, finger: "2" },
      { string: 2, fret: 3, finger: "3" },
      { string: 3, fret: 2, finger: "1" },
      { string: 4, fret: 0 },
      { string: 5, fret: -1 },
      { string: 6, fret: -1 }
    ],
    piano: ["D", "F#", "A"],
    notesInfo: "D - F# - A (Root - Major 3rd - Perfect 5th)"
  }
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const PIANO_KEYS_LAYOUT: PianoKey[] = [
  { note: "C", isBlack: false, midiIndex: 0 },
  { note: "C#", isBlack: true, midiIndex: 1 },
  { note: "D", isBlack: false, midiIndex: 2 },
  { note: "D#", isBlack: true, midiIndex: 3 },
  { note: "E", isBlack: false, midiIndex: 4 },
  { note: "F", isBlack: false, midiIndex: 5 },
  { note: "F#", isBlack: true, midiIndex: 6 },
  { note: "G", isBlack: false, midiIndex: 7 },
  { note: "G#", isBlack: true, midiIndex: 8 },
  { note: "A", isBlack: false, midiIndex: 9 },
  { note: "A#", isBlack: true, midiIndex: 10 },
  { note: "B", isBlack: false, midiIndex: 11 },
  { note: "C_oct", isBlack: false, midiIndex: 12 },
  { note: "C#_oct", isBlack: true, midiIndex: 13 },
  { note: "D_oct", isBlack: false, midiIndex: 14 },
  { note: "D#_oct", isBlack: true, midiIndex: 15 },
  { note: "E_oct", isBlack: false, midiIndex: 16 },
  { note: "F_oct", isBlack: false, midiIndex: 17 },
  { note: "F#_oct", isBlack: true, midiIndex: 18 },
  { note: "G_oct", isBlack: false, midiIndex: 19 },
  { note: "G#_oct", isBlack: true, midiIndex: 20 },
  { note: "A_oct", isBlack: false, midiIndex: 21 },
  { note: "A#_oct", isBlack: true, midiIndex: 22 },
  { note: "B_oct", isBlack: false, midiIndex: 23 }
];

export function MicrophoneAnalyzer() {
  const [activeChord, setActiveChord] = useState<string>("C Major");
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [chromaValues, setChromaValues] = useState<number[]>(new Array(12).fill(10));
  const [frequencyData, setFrequencyData] = useState<number[]>(new Array(40).fill(5));
  const [micError, setMicError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const simulationTimer = useRef<number | null>(null);

  // Auto progression indices for the simulated play-along: C -> Am -> F -> G
  const simChords = ["C Major", "A Minor", "F Major", "G Major", "E Minor", "D Major"];
  const simIndex = useRef<number>(0);

  // Initialize Simulator on Mount
  useEffect(() => {
    if (isSimulating) {
      startSimulation();
    }
    return () => {
      stopSimulation();
      stopMicrophone();
    };
  }, [isSimulating]);

  const startSimulation = () => {
    stopMicrophone();
    setIsSimulating(true);
    setMicError(null);

    // Swap simulated chords every 3 seconds
    simulationTimer.current = window.setInterval(() => {
      simIndex.current = (simIndex.current + 1) % simChords.length;
      const nextChord = simChords[simIndex.current];
      setActiveChord(nextChord);

      // Mutate chroma values towards the chord notes
      const chordDetail = CHORD_LIBRARY[nextChord];
      const nextChroma = new Array(12).fill(0).map(() => Math.floor(Math.random() * 15) + 5);
      
      // Inject high values for actual chord notes
      chordDetail.piano.forEach(noteName => {
        // Clean octave label if present
        const note = noteName.replace("_oct", "").replace("#", "\\#");
        const idx = NOTE_NAMES.indexOf(noteName.replace("_oct", ""));
        if (idx !== -1) {
          nextChroma[idx] = Math.floor(Math.random() * 25) + 75; // 75-100% volume
        }
      });
      setChromaValues(nextChroma);

      // Generate funny dynamic frequency look
      const freq = new Array(40).fill(0).map((_, i) => {
        const base = Math.sin(i * 0.4) * 30 + 40;
        return Math.floor(base + Math.random() * 20);
      });
      setFrequencyData(freq);

    }, 3000);
  };

  const stopSimulation = () => {
    if (simulationTimer.current) {
      clearInterval(simulationTimer.current);
      simulationTimer.current = null;
    }
  };

  // Web Audio API setup for raw mic tracking
  const startMicrophone = async () => {
    stopSimulation();
    setIsSimulating(false);
    setMicError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsCapturing(true);
      analyseAudio();

    } catch (err: any) {
      console.error("Microphone hardware connection error:", err);
      setMicError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Camera/Microphone frame permission is required. Check browser permission block."
          : `Live connection failed: ${err.message || "Unknown error"}`
      );
      // Fallback automatically to high-end simulation
      setIsSimulating(true);
    }
  };

  const stopMicrophone = () => {
    setIsCapturing(false);
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
      audioContextRef.current = null;
    }
  };

  const analyseAudio = () => {
    if (!analyserRef.current || !isCapturing) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // 1. Build rapid simulated frequency bin data for the premium spectrum widget
    const compressedFreqs: number[] = [];
    const step = Math.floor(bufferLength / 40);
    for (let i = 0; i < 40; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) {
        sum += dataArray[i * step + j] || 0;
      }
      compressedFreqs.push(Math.round(sum / step));
    }
    setFrequencyData(compressedFreqs);

    // 2. Perform a real pitch chroma categorization on incoming FFT data!
    // Compute chroma vector: we map standard FFT bins back to log-scale piano freqs
    const sampleRate = audioContextRef.current?.sampleRate || 44100;
    const chromaEnergies = new Array(12).fill(0.01);

    for (let bin = 1; bin < bufferLength; bin++) {
      const magnitude = dataArray[bin];
      if (magnitude < 30) continue; // Noise filter gate

      // Map bin back to Hz coordinate
      const hz = (bin * sampleRate) / (bufferLength * 2);
      if (hz < 80 || hz > 2000) continue; // Focus human vocal/guitar fundamental pitch bounds

      // Calculate approximate midi note key: 12 * log2(Hz / 440) + 69
      const midiNote = Math.round(12 * Math.log2(hz / 440) + 69);
      const noteClass = midiNote % 12;
      if (noteClass >= 0 && noteClass < 12) {
        chromaEnergies[noteClass] += magnitude;
      }
    }

    // Smooth & normalize chroma values to scale on 0-100
    const maxEnergy = Math.max(...chromaEnergies);
    const normalizedChroma = chromaEnergies.map(energy => {
      if (maxEnergy === 0.01) return Math.floor(Math.random() * 10) + 5;
      return Math.round((energy / maxEnergy) * 100);
    });
    setChromaValues(normalizedChroma);

    // 3. Real-Time Pitch Chord Template Matching Classifier
    // Compare the active live chroma energies with standard major/minor triad masks
    let bestChordScore = -1;
    let detectedChordString = "C Major";

    Object.entries(CHORD_LIBRARY).forEach(([chordKey, chordSpec]) => {
      let chordScore = 0;
      chordSpec.piano.forEach(pianoNote => {
        const cleanNote = pianoNote.replace("_oct", "");
        const idx = NOTE_NAMES.indexOf(cleanNote);
        if (idx !== -1) {
          // Weight chord constituents heavily
          chordScore += normalizedChroma[idx] * 2.5;
        }
      });

      // Penalize notes outside the triad to prevent major-bleed false matches
      NOTE_NAMES.forEach((note, idx) => {
        const isPartOfChord = chordSpec.piano.some(p => p.replace("_oct", "") === note);
        if (!isPartOfChord) {
          chordScore -= normalizedChroma[idx] * 0.8;
        }
      });

      if (chordScore > bestChordScore) {
        bestChordScore = chordScore;
        detectedChordString = chordKey;
      }
    });

    // Safeguard sensitivity gate
    if (maxEnergy > 40) {
      setActiveChord(detectedChordString);
    }

    // Keep loop hot
    animationFrameId.current = requestAnimationFrame(analyseAudio);
  };

  // Active chord specification
  const currentChordSpec = CHORD_LIBRARY[activeChord] || CHORD_LIBRARY["C Major"];

  return (
    <div className="bg-[#161B22] rounded-xl border border-gray-800 p-6 shadow-xl" id="mic-chord-sandbox">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-lg font-sans font-medium text-white">Interactive SOTA Audio Sandbox</h3>
          </div>
          <p className="text-xs text-gray-400 max-w-xl">
            Experience our low-latency client analysis pipeline. Toggle standard microphone mode or run our simulation progression to preview guitar and keyboard charts.
          </p>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-3">
          <button
            id="toggle-sim-mode"
            onClick={() => {
              setIsSimulating(true);
              stopMicrophone();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${
              isSimulating
                ? "bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-900/10"
                : "bg-[#0B0C10] text-[#a9b2c3] hover:bg-gray-800 border border-gray-800"
            }`}
          >
            <Play size={13} className="mr-0.5" />
            Co-Founder Loop
          </button>

          <button
            id="toggle-mic-mode"
            onClick={isCapturing ? () => {
              setIsSimulating(true);
              stopMicrophone();
            } : startMicrophone}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${
              isCapturing
                ? "bg-red-600 text-white shadow-lg shadow-red-900/30 border border-red-500/30"
                : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-950/20 border border-emerald-500/30"
            }`}
          >
            {isCapturing ? <Square size={13} className="mr-0.5" /> : <Mic size={13} className="mr-0.5" />}
            {isCapturing ? "Stop Capture" : "Capture Microphone"}
          </button>
        </div>
      </div>

      {/* Frame Permission Notice Block */}
      {micError && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3 items-start" id="mic-permission-notice">
          <Info className="text-amber-400 flex-shrink-0 mt-0.5" size={16} />
          <div>
            <h4 className="text-xs font-semibold text-amber-300">Microphone Access Restriction Notice</h4>
            <p className="text-xxs text-gray-300 leading-relaxed mt-1">
              {micError} Fallback loop simulator is active below so you can inspect how the synced tabs engine registers audio.
            </p>
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chord & Spectrum Display Column (L: 4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Main Detected Output Panel */}
          <div className="bg-[#0B0C10] rounded-xl border border-gray-800 p-5 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[160px]">
            {/* Background glowing effects */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500" />
            <div className="absolute -bottom-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

            <span className="text-xxs font-mono tracking-wider text-gray-400 uppercase mb-2">
              {isCapturing ? "LIVE INPUT ANALYZER" : "CO-FOUNDER METADATA DEMO"}
            </span>
            <span className="text-4xl font-sans font-bold text-white tracking-tight leading-none mb-1 text-cyan-400 animate-pulse">
              {activeChord}
            </span>
            <span className="text-xs text-gray-300 font-mono mt-1 bg-[#161B22] border border-gray-800 px-2.5 py-1 rounded-full">
              {currentChordSpec.notesInfo}
            </span>
          </div>

          {/* Real-Time Chromagram Vectors (Spectral Class Profile) */}
          <div className="bg-[#0B0C10] rounded-xl border border-gray-800 p-5">
            <h4 className="text-xs font-sans font-medium text-gray-300 mb-4 flex items-center justify-between">
              <span>Chroma Vector Profiler</span>
              <span className="text-[10px] font-mono text-gray-400 uppercase bg-[#161B22] border border-gray-800 px-2 py-0.5 rounded">12-Tone Log Scale</span>
            </h4>
            
            {/* Visual Equalizer Bars */}
            <div className="flex justify-between items-end h-28 gap-1 pt-2">
              {NOTE_NAMES.map((name, idx) => {
                const height = chromaValues[idx] || 5;
                const isActive = currentChordSpec.piano.some(p => p.replace("_oct", "") === name);

                return (
                  <div key={name} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div className="w-full bg-gray-900 rounded-t overflow-hidden h-full flex items-end border border-gray-800">
                      <div
                        className={`w-full transition-all duration-150 rounded-t ${
                          isActive
                            ? "bg-gradient-to-t from-cyan-600 to-cyan-400 border-t-2 border-cyan-300"
                            : "bg-gradient-to-t from-slate-800 to-slate-700 opacity-20"
                        }`}
                        style={{ height: `${Math.max(6, height)}%` }}
                      />
                    </div>
                    <span className={`text-[9px] font-mono leading-none ${isActive ? "text-cyan-400 font-bold" : "text-gray-500"}`}>
                      {name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Structural Tab Visualization Column (R: 8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Guitar Fretboard Tab Visualizer */}
          <div className="bg-[#0B0C10] rounded-xl border border-gray-800 p-5">
            <h4 className="text-xs font-sans font-medium text-gray-300 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Music size={14} className="text-cyan-400" />
                Interlocking Fretboard (Synced Guitar Tab)
              </span>
              <span className="text-[10px] font-mono text-gray-400">Standard Tuning (E A D G B e)</span>
            </h4>

            {/* Simulated Guitar Fretboard Grid Rendering */}
            <div className="overflow-x-auto py-2">
              <div className="min-w-[620px] relative">
                
                {/* Visual Nut (0 fret line) */}
                <div className="absolute left-[40px] top-0 bottom-0 w-2.5 bg-yellow-600/80 rounded shadow-md z-10" />

                {/* 6 strings rendering */}
                <div className="relative flex flex-col gap-5 py-4 bg-[#050608] rounded-lg border border-gray-800 px-3">
                  {/* Fret Markers markers at 3, 5, 7, 9, 12 */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {[3, 5, 7, 9, 12].map(fIndex => (
                      <div
                        key={fIndex}
                        style={{ left: `${fIndex * 46 + 20}px` }}
                        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-700/60"
                      />
                    ))}
                  </div>

                  {[1, 2, 3, 4, 5, 6].map(stringNum => {
                    // Find active finger position on this string
                    const activePos = currentChordSpec.guitar.find(g => g.string === stringNum);
                    const stringLabels = ["e", "B", "G", "D", "A", "E"];

                    return (
                      <div key={stringNum} className="h-4 flex items-center relative select-none">
                        
                        {/* String Name Label */}
                        <div className="w-10 text-xs font-mono text-slate-500 text-right pr-3 font-semibold">
                          {stringLabels[stringNum - 1]}
                        </div>

                        {/* Fret subdivisions */}
                        <div className="flex-1 flex items-center relative h-full">
                          
                          {/* Metal string lines crossing over frets */}
                          <div className="absolute left-0 right-0 h-[1.5px] bg-gradient-to-r from-yellow-800/80 via-slate-500/50 to-slate-600/30 z-0" />
                          
                          {/* Loop render frets (0 to 12) */}
                          {Array.from({ length: 13 }).map((_, fIdx) => {
                            const isNut = fIdx === 0;
                            // Find out if dot lies on this exact fret
                            const isFingerHere = activePos && activePos.fret === fIdx;

                            return (
                              <div
                                key={fIdx}
                                className="relative flex-1 flex items-center justify-center z-10"
                                style={{ minWidth: "42px" }}
                              >
                                {/* Metal Fret Marker lines */}
                                {!isNut && (
                                  <div className="absolute right-0 top-[-10px] bottom-[-10px] w-[2px] bg-slate-600/40 z-0" />
                                )}

                                {/* If finger is muted ('-1') on string, draw red X before nut */}
                                {isNut && activePos && activePos.fret === -1 && (
                                  <div className="absolute left-[-5px] top-1/2 -translate-y-1/2 text-red-500 font-mono text-xs font-bold leading-none">
                                    X
                                  </div>
                                )}

                                {/* Open string indicator (cyan ring) */}
                                {isNut && activePos && activePos.fret === 0 && (
                                  <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-cyan-400 bg-[#0B0C10]" />
                                )}

                                {/* Pressed finger Dot */}
                                {isFingerHere && !isNut && (
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-700 shadow-md flex items-center justify-center font-mono text-[10px] text-white font-bold animate-bounce z-20 border border-white/30">
                                    {activePos?.finger || "•"}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Guide Map Footer */}
            <div className="mt-3 flex items-center gap-4 text-[10px] text-gray-400 border-t border-gray-800 pt-3">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-cyan-500" /> Pressed String
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full border border-cyan-400" /> Open String
              </span>
              <span className="flex items-center gap-1">
                <span className="text-red-500 font-bold font-mono">X</span> Muted/Unplayed String
              </span>
            </div>
          </div>          {/* Piano Keyboard Map Visualizer */}
          <div className="bg-[#0B0C10] rounded-xl border border-gray-800 p-5">
            <h4 className="text-xs font-sans font-medium text-gray-300 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers size={14} className="text-cyan-400" />
                Dual-Octave Piano Keyboard Mapping
              </span>
              <span className="text-[10px] font-mono text-gray-400">MIDI Notes class output</span>
            </h4>

            {/* Interactive representation of the keyboard keys */}
            <div className="bg-[#050608] p-3 rounded-lg border border-gray-800 relative">
              <div className="flex h-32 relative select-none">
                {PIANO_KEYS_LAYOUT.map((pianoKey) => {
                  // Figure out if note label is pressed
                  const baseNoteName = pianoKey.note.replace("_oct", "");
                  const isPressed = currentChordSpec.piano.some((pNote) => {
                    const cleanPNote = pNote.replace("_oct", "");
                    return cleanPNote === baseNoteName;
                  });

                  if (pianoKey.isBlack) {
                    // Black keys are absolutely positioned relative to white key offsets
                    return (
                      <div
                        key={pianoKey.note}
                        className={`absolute top-0 h-18 w-5 sm:w-6 transition-colors duration-150 rounded-b z-30 flex items-end justify-center pb-2 ${
                          isPressed
                            ? "bg-gradient-to-b from-cyan-600 to-cyan-400 border-b-2 border-cyan-300 shadow-lg"
                            : "bg-gray-950 hover:bg-black border-x border-gray-800"
                        }`}
                        // Approximate left alignment depending on keys layout. 
                        // To keep it responsive yet simple, we estimate coordinates based on pitch index
                        style={{
                          left: `${
                            (pianoKey.midiIndex === 1 ? 23 :
                             pianoKey.midiIndex === 3 ? 55 :
                             pianoKey.midiIndex === 6 ? 108 :
                             pianoKey.midiIndex === 8 ? 140 :
                             pianoKey.midiIndex === 10 ? 172 :
                             pianoKey.midiIndex === 13 ? 224 :
                             pianoKey.midiIndex === 15 ? 256 :
                             pianoKey.midiIndex === 18 ? 309 :
                             pianoKey.midiIndex === 20 ? 342 : 374)
                          }px`
                        }}
                      >
                        <span className="text-[7px] font-mono text-gray-300 font-bold">{pianoKey.note}</span>
                      </div>
                    );
                  } else {
                    // White keys
                    return (
                      <div
                        key={pianoKey.note}
                        className={`flex-1 min-h-full transition-all duration-150 rounded-b border-r border-gray-800 flex items-end justify-center pb-2 z-10 ${
                          isPressed
                            ? "bg-gradient-to-b from-cyan-700 to-cyan-500 text-white font-bold border-b-2 border-cyan-300"
                            : "bg-gray-100 hover:bg-white text-gray-900 border-r border-gray-300"
                        }`}
                      >
                        <span className="text-[9px] font-mono font-bold">{pianoKey.note.replace("_oct", "")}</span>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
export default MicrophoneAnalyzer;
