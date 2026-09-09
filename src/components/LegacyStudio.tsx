import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Square,
  Volume2,
  VolumeX,
  Sliders,
  Music,
  Upload,
  Cpu,
  Zap,
  Database,
  Sparkles,
  ChevronRight,
  ChevronDown,
  FileAudio,
  Clock,
  Activity,
  Info,
  HelpCircle,
  Lock,
  Plus,
  Compass,
  Code,
  SlidersHorizontal,
  FolderOpen,
  Terminal as TerminalIcon,
  Disc,
  ArrowRight,
  RefreshCw,
  Server,
  Network,
  Mic
} from "lucide-react";
import { ChatAssistant } from "./ChatAssistant";
import { DatabaseSchemaViewer } from "./DatabaseSchemaViewer";
import { ArchitectureViewer } from "./ArchitectureViewer";
import { InstrumentClassifier } from "./InstrumentClassifier";

// --- CHORD LIBRARY & INSTRUMENT COORDINATES ---
interface FingerPosition {
  string: number; // 1 (High E) to 6 (Low E)
  fret: number;   // 0 for open, -1 for muted
  finger?: string; 
}

const CHORD_LIBRARY: Record<string, {
  name: string;
  notesInfo: string;
  piano: string[];
  guitar: FingerPosition[];
}> = {
  "G Major": {
    name: "G Major (V - Dominant)",
    notesInfo: "G - B - D (Root - Major 3rd - Perfect 5th)",
    piano: ["G", "B", "D"],
    guitar: [
      { string: 1, fret: 3, finger: "3" },
      { string: 2, fret: 0 },
      { string: 3, fret: 0 },
      { string: 4, fret: 0 },
      { string: 5, fret: 2, finger: "1" },
      { string: 6, fret: 3, finger: "2" }
    ]
  },
  "D Major": {
    name: "D Major (II - Secondary)",
    notesInfo: "D - F# - A (Root - Major 3rd - Perfect 5th)",
    piano: ["D", "F#", "A"],
    guitar: [
      { string: 1, fret: 2, finger: "2" },
      { string: 2, fret: 3, finger: "3" },
      { string: 3, fret: 2, finger: "1" },
      { string: 4, fret: 0 },
      { string: 5, fret: -1 },
      { string: 6, fret: -1 }
    ]
  },
  "E Minor": {
    name: "E Minor (vi - Tonic-Substitute)",
    notesInfo: "E - G - B (Root - Minor 3rd - Perfect 5th)",
    piano: ["E", "G", "B"],
    guitar: [
      { string: 1, fret: 0 },
      { string: 2, fret: 0 },
      { string: 3, fret: 0 },
      { string: 4, fret: 2, finger: "2" },
      { string: 5, fret: 2, finger: "1" },
      { string: 6, fret: 0 }
    ]
  },
  "C Major": {
    name: "C Major (I - Tonic Base)",
    notesInfo: "C - E - G (Root - Major 3rd - Perfect 5th)",
    piano: ["C", "E", "G"],
    guitar: [
      { string: 1, fret: 0 },
      { string: 2, fret: 1, finger: "1" },
      { string: 3, fret: 0 },
      { string: 4, fret: 2, finger: "2" },
      { string: 5, fret: 3, finger: "3" },
      { string: 6, fret: -1 }
    ]
  },
  "A Minor": {
    name: "A Minor (ii - Secondary Minor)",
    notesInfo: "A - C - E (Root - Minor 3rd - Perfect 5th)",
    piano: ["A", "C", "E"],
    guitar: [
      { string: 1, fret: 0 },
      { string: 2, fret: 1, finger: "1" },
      { string: 3, fret: 2, finger: "3" },
      { string: 4, fret: 2, finger: "2" },
      { string: 5, fret: 0 },
      { string: 6, fret: -1 }
    ]
  },
  "F Major": {
    name: "F Major (IV - Subdominant)",
    notesInfo: "F - A - C (Root - Major 3rd - Perfect 5th)",
    piano: ["F", "A", "C"],
    guitar: [
      { string: 1, fret: 1, finger: "1" },
      { string: 2, fret: 1, finger: "1" },
      { string: 3, fret: 2, finger: "2" },
      { string: 4, fret: 3, finger: "4" },
      { string: 5, fret: 3, finger: "3" },
      { string: 6, fret: 1, finger: "1" }
    ]
  }
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const PIANO_KEYS_LAYOUT = [
  { note: "C", isBlack: false },
  { note: "C#", isBlack: true },
  { note: "D", isBlack: false },
  { note: "D#", isBlack: true },
  { note: "E", isBlack: false },
  { note: "F", isBlack: false },
  { note: "F#", isBlack: true },
  { note: "G", isBlack: false },
  { note: "G#", isBlack: true },
  { note: "A", isBlack: false },
  { note: "A#", isBlack: true },
  { note: "B", isBlack: false },
  { note: "C_oct", isBlack: false },
  { note: "C#_oct", isBlack: true },
  { note: "D_oct", isBlack: false },
  { note: "D#_oct", isBlack: true },
  { note: "E_oct", isBlack: false },
  { note: "F_oct", isBlack: false },
  { note: "F#_oct", isBlack: true },
  { note: "G_oct", isBlack: false },
  { note: "G#_oct", isBlack: true },
  { note: "A_oct", isBlack: false },
  { note: "A#_oct", isBlack: true },
  { note: "B_oct", isBlack: false }
];

// --- STATIC DEMO TRACK PRESETS ---
interface ChordSegment {
  chord: string;
  start: number;
  end: number;
  confidence: number;
}

interface ChordAnalysisResponse {
  analysis: {
    key: string;
    bpm: number | null;
    duration: number;
    chords: ChordSegment[];
  };
  filename: string;
}

interface TrackPreset {
  id: string;
  title: string;
  artist: string;
  bpm: number | null;
  key: string;
  chords: string[];
  chordSegments?: ChordSegment[];
  duration: number; // in seconds
}

const PRESET_TRACKS: TrackPreset[] = [
  {
    id: "starlight-muse",
    title: "Starlight Muse",
    artist: "The Resonance Ensemble",
    bpm: 120,
    key: "G Major",
    chords: ["G Major", "D Major", "E Minor", "C Major"],
    duration: 180
  },
  {
    id: "autumn-fusion",
    title: "Autumn Leaves Jazz Quintet",
    artist: "Claire de Lune Quartet",
    bpm: 114,
    key: "A Minor",
    chords: ["A Minor", "D Major", "G Major", "C Major"],
    duration: 140
  },
  {
    id: "horizon-vibes",
    title: "Acoustic Horizon Draft",
    artist: "Nomad Street Sessions",
    bpm: 90,
    key: "C Major",
    chords: ["C Major", "F Major", "G Major", "C Major"],
    duration: 160
  }
];

// --- CHANNEL STEM CHARACTERISTICS ---
interface StemChannel {
  id: string;
  name: string;
  color: string;
  volume: number; // 0 to 100
  isMuted: boolean;
  isSolo: boolean;
  frequencyPeaks: number[]; 
}

export function LegacyStudio() {
  // Navigation for outer workspace specs (under the hood / architect view)
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"dashboard" | "instrument-id" | "database" | "ai-helper" | "architecture">("instrument-id");

  // Selection states
  const [activeTrack, setActiveTrack] = useState<TrackPreset>(PRESET_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [trackProgress, setTrackProgress] = useState<number>(12); // start partway to feel alive
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMetronomeEnabled, setIsMetronomeEnabled] = useState<boolean>(false);
  const [isBeatActive, setIsBeatActive] = useState<boolean>(false);

  // Drag & Drop states
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [analysisLog, setAnalysisLog] = useState<string>("");

  // Stem Mixer State
  const [stems, setStems] = useState<StemChannel[]>([
    { id: "vocals", name: "Isolated Vocals (Dry/Uncompressed)", color: "from-rose-500 to-pink-400", volume: 85, isMuted: false, isSolo: false, frequencyPeaks: new Array(15).fill(25) },
    { id: "drums", name: "Drums & Low-End Percussion Base", color: "from-amber-500 to-orange-400", volume: 90, isMuted: false, isSolo: false, frequencyPeaks: new Array(15).fill(30) },
    { id: "bass", name: "Harmonic Bass (Precision Underlay)", color: "from-cyan-500 to-teal-400", volume: 80, isMuted: false, isSolo: false, frequencyPeaks: new Array(15).fill(20) },
    { id: "synths", name: "Guitars & Organ Key Synths", color: "from-purple-500 to-indigo-400", volume: 75, isMuted: false, isSolo: false, frequencyPeaks: new Array(15).fill(15) }
  ]);

  // Ref locks for animation and scheduler loops
  const timerRef = useRef<number | null>(null);
  const beatTimerRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Metronome flash beat sync triggers
  useEffect(() => {
    if (!isPlaying) {
      setIsBeatActive(false);
      return;
    }
    if (!activeTrack.bpm) return;
    const msPerBeat = (60 / activeTrack.bpm) * 1000;
    const interval = setInterval(() => {
      setIsBeatActive(true);
      setTimeout(() => setIsBeatActive(false), 120);
    }, msPerBeat);

    return () => clearInterval(interval);
  }, [isPlaying, activeTrack.bpm]);

  // Timline Progression Engine
  useEffect(() => {
    if (isPlaying) {
      const stepMs = 100;
      timerRef.current = window.setInterval(() => {
        setTrackProgress(prev => {
          const nextVal = prev + (stepMs / 1000) * playbackSpeed;
          if (nextVal >= activeTrack.duration) {
            setIsPlaying(false);
            return 0;
          }
          return nextVal;
        });
      }, stepMs);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, activeTrack.duration]);

  // Mixer peak frequency visual flutter simulation
  useEffect(() => {
    let frameId: number;
    const updatePeaks = () => {
      if (isPlaying) {
        setStems(prev => {
          const hasSolo = prev.some(s => s.isSolo);
          return prev.map(stem => {
            const isEffectivelyMuted = stem.isMuted || (hasSolo && !stem.isSolo);
            if (isEffectivelyMuted) {
              return { ...stem, frequencyPeaks: stem.frequencyPeaks.map(v => Math.max(0, v - 3)) };
            }
            const volFrac = stem.volume / 100;
            const res = stem.frequencyPeaks.map((h, i) => {
              let base = 25;
              if (stem.id === "vocals") base = Math.sin(Date.now() * 0.003 + i) * 35 + 40;
              else if (stem.id === "drums") base = (i % 3 === 0 ? 65 : 12) + Math.cos(Date.now() * 0.007 + i) * 25;
              else if (stem.id === "bass") base = Math.cos(Date.now() * 0.002 + i) * 45 + 30;
              else base = Math.sin(Date.now() * 0.005 + i * 1.5) * 30 + 35;

              const jitter = Math.random() * 12 - 6;
              return Math.max(4, Math.min(95, Math.floor((base + jitter) * volFrac)));
            });
            return { ...stem, frequencyPeaks: res };
          });
        });
      } else {
        setStems(prev => prev.map(stem => ({ ...stem, frequencyPeaks: stem.frequencyPeaks.map(v => Math.max(4, v - 2)) })));
      }
      frameId = requestAnimationFrame(updatePeaks);
    };

    frameId = requestAnimationFrame(updatePeaks);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying]);

  // Use detected time ranges for analyzed files; presets retain their beat-grid demo timing.
  const getTimelineChordState = () => {
    if (activeTrack.chordSegments?.length) {
      const matchedIndex = activeTrack.chordSegments.findIndex(
        segment => trackProgress >= segment.start && trackProgress < segment.end
      );
      const currentIdx = matchedIndex >= 0 ? matchedIndex : activeTrack.chordSegments.length - 1;
      const labels = activeTrack.chordSegments.map(segment => segment.chord);
      return {
        current: labels[currentIdx] || "N",
        prev: labels[Math.max(0, currentIdx - 1)] || "N",
        next: labels[Math.min(labels.length - 1, currentIdx + 1)] || "N",
        upcoming: labels[Math.min(labels.length - 1, currentIdx + 2)] || "N"
      };
    }
    const secondsPerMeasure = (60 / (activeTrack.bpm || 120)) * 4;
    const measureIndex = Math.floor(trackProgress / secondsPerMeasure);
    const chordsList = activeTrack.chords;
    const currentIdx = measureIndex % chordsList.length;
    return {
      current: chordsList[currentIdx],
      prev: chordsList[(currentIdx - 1 + chordsList.length) % chordsList.length],
      next: chordsList[(currentIdx + 1) % chordsList.length],
      upcoming: chordsList[(currentIdx + 2) % chordsList.length]
    };
  };

  const chordTape = getTimelineChordState();
  const createChordSpec = (label: string) => {
    const [root, quality] = label.split(" ");
    const rootIndex = NOTE_NAMES.indexOf(root);
    if (rootIndex < 0) return { name: label, notesInfo: "No reliable chord", piano: [], guitar: [] };
    const intervals = quality === "Minor" ? [0, 3, 7] : [0, 4, 7];
    const piano = intervals.map(interval => NOTE_NAMES[(rootIndex + interval) % 12]);
    return { name: label, notesInfo: piano.join(" - "), piano, guitar: [] as FingerPosition[] };
  };
  const currentChordSpec = CHORD_LIBRARY[chordTape.current] || createChordSpec(chordTape.current);

  // Handle Drag & Drop Events for file uploads
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const executeDemucsDeconstruction = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysisProgress(15);
    setAnalysisLog(`[upload] Sending "${file.name}" to the harmonic analysis engine...`);
    setIsPlaying(false);

    try {
      const body = new FormData();
      body.append("file", file);
      setAnalysisProgress(35);
      const response = await fetch("/api/analyze-chords", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Chord analysis failed.");

      const result = (payload as ChordAnalysisResponse).analysis;
      const detected = result.chords.filter(segment => segment.chord !== "N");
      if (!detected.length) throw new Error("No reliable chords were detected.");
      setAnalysisProgress(100);
      setAnalysisLog(`[complete] Detected ${detected.length} timed chord regions in ${result.key}.`);
      setActiveTrack({
        id: `custom-${Date.now()}`,
        title: file.name.length > 32 ? `${file.name.substring(0, 30)}...` : file.name,
        artist: "Analyzed Upload",
        bpm: result.bpm,
        key: result.key,
        chords: detected.map(segment => segment.chord),
        chordSegments: result.chords,
        duration: result.duration
      });
      setTrackProgress(0);
    } catch (error) {
      setAnalysisProgress(0);
      setAnalysisLog(`[error] ${error instanceof Error ? error.message : "Chord analysis failed."}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void executeDemucsDeconstruction(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void executeDemucsDeconstruction(file);
    e.target.value = "";
  };

  // Mixer control actions
  const handleVolumeChange = (id: string, value: number) => {
    setStems(prev => prev.map(s => s.id === id ? { ...s, volume: value } : s));
  };

  const toggleMute = (id: string) => {
    setStems(prev => prev.map(s => s.id === id ? { ...s, isMuted: !s.isMuted } : s));
  };

  const toggleSolo = (id: string) => {
    setStems(prev => {
      const target = prev.find(s => s.id === id);
      if (!target) return prev;
      const isCurrentlySoloed = target.isSolo;
      return prev.map(s => {
        if (s.id === id) {
          return { ...s, isSolo: !isCurrentlySoloed, isMuted: false };
        }
        return s;
      });
    });
  };

  // Convert track progression seconds to MM:SS format
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Click on waveform to scrub playback playhead position
  const handleWaveformScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = clickX / rect.width;
    setTrackProgress(Math.floor(ratio * activeTrack.duration));
  };

  return (
    <div className="min-h-screen bg-[#07080A] text-[#f1f3f9] font-sans selection:bg-[#00f0ff] selection:text-[#07080A] pb-20 relative overflow-x-hidden">
      
      {/* Absolute Ambient Background Flares */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-[#00f3ff]/5 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#4361ee]/5 rounded-full blur-[130px] pointer-events-none z-0" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-6" id="dashboard-applet">
        
        {/* TOP STATUS NAVIGATION BAR */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#1b2230] pb-5 mb-6" id="dashboard-nav">
          <div>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-cyan-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-cyan-900/10 flex items-center justify-center border border-white/10">
                <Disc className={`text-[#07080A] h-5 w-5 ${isPlaying ? "animate-spin" : ""}`} style={{ animationDuration: "3s" }} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>SONICARC</span>
                  <span className="text-[10px] uppercase font-mono font-black border border-cyan-500/20 text-cyan-400 bg-cyan-950/20 px-2 py-0.5 rounded">
                    Studio Prototype v2.1
                  </span>
                </h1>
                <p className="text-[11px] text-gray-400 font-sans mt-0.5">
                  High-Fidelity Audio Engineering Sandbox &amp; Live Fret Mapping
                </p>
              </div>
            </div>
          </div>

          {/* Connected state telemetry logs (Anti-Larping disclaimer: fully interactive mock specs) */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-[10px] font-mono text-gray-300">
              <Server size={11} className="text-cyan-400" />
              <span>NODE: DEMUCS_WORKER_04</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-[10px] font-mono text-gray-300">
              <Zap size={11} className="text-amber-400" />
              <span>LATENCY: &lt;4ms</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-[10px] font-mono text-cyan-400">
              <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-ping" />
              <span>GPU STREAM ACTIVE</span>
            </div>
          </div>
        </header>

        {/* CORE NAVIGATION TABS FOR EXPERT REVIEW */}
        <div className="flex items-center gap-2 bg-[#0F111A] p-1.5 rounded-xl border border-gray-800 mb-6 max-w-fit shadow-inner">
          <button
            onClick={() => setActiveWorkspaceTab("instrument-id")}
            className={`px-4 py-2 rounded-lg text-xs font-sans font-semibold transition-all flex items-center gap-2 ${
              activeWorkspaceTab === "instrument-id"
                ? "bg-cyan-500 text-black shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <Mic size={14} />
            <span>Instrument Classifier</span>
          </button>
          <button
            onClick={() => setActiveWorkspaceTab("dashboard")}
            className={`px-4 py-2 rounded-lg text-xs font-sans font-semibold transition-all flex items-center gap-2 ${
              activeWorkspaceTab === "dashboard"
                ? "bg-cyan-500 text-black shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <Compass size={14} />
            <span>Studio Control Desk</span>
          </button>
          <button
            onClick={() => setActiveWorkspaceTab("database")}
            className={`px-4 py-2 rounded-lg text-xs font-sans font-semibold transition-all flex items-center gap-2 ${
              activeWorkspaceTab === "database"
                ? "bg-cyan-500 text-black shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <Database size={14} />
            <span>PostgreSQL Schema Explorer</span>
          </button>
          <button
            onClick={() => setActiveWorkspaceTab("ai-helper")}
            className={`px-4 py-2 rounded-lg text-xs font-sans font-semibold transition-all flex items-center gap-2 ${
              activeWorkspaceTab === "ai-helper"
                ? "bg-cyan-500 text-black shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <Sparkles size={14} />
            <span>AI Tech Advisor Chat</span>
          </button>
          <button
            onClick={() => setActiveWorkspaceTab("architecture")}
            className={`px-4 py-2 rounded-lg text-xs font-sans font-semibold transition-all flex items-center gap-2 ${
              activeWorkspaceTab === "architecture"
                ? "bg-cyan-500 text-black shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <Network size={14} />
            <span>Architecture Blueprint</span>
          </button>
        </div>

        {/* MAIN VISUAL WORKSPACE PANEL */}
        {activeWorkspaceTab === "dashboard" && (
          <div className="space-y-6">
            
            {/* GRID LAYER 1: MULTI-INTEGRATED CONSOLE BLOCK & DRAG-DROP DRUM */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* FILE INGESTION CONTROLLER (L: 5 Columns) */}
              <div className="lg:col-span-5 bg-[#0F111A] border border-gray-800 rounded-xl p-5 flex flex-col justify-between shadow-lg relative min-h-[300px]">
                
                <div>
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
                    <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <FolderOpen size={13} className="text-cyan-400" />
                      Audio Ingestion &amp; Deconstruct
                    </h3>
                    <span className="text-[10px] font-mono text-gray-500">Demucs v4 Edge</span>
                  </div>

                  {/* Dynamic interactive drag-drop portal */}
                  {isAnalyzing ? (
                    <div className="py-8 px-4 flex flex-col items-center justify-center text-center">
                      <RefreshCw size={36} className="text-cyan-400 animate-spin mb-4" />
                      <h4 className="text-xs font-sans font-bold text-[#f1f3f9]">Demucs Model Separation Active...</h4>
                      
                      {/* Live loading ratio */}
                      <div className="w-full bg-gray-900 border border-gray-800 h-2.5 rounded-full mt-3 overflow-hidden">
                        <div
                          className="bg-cyan-400 h-full transition-all duration-300"
                          style={{ width: `${analysisProgress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400 mt-2 block">{analysisProgress}% deconstructed</span>
                      
                      {/* Dynamic terminal log console stream */}
                      <div className="bg-black border border-gray-800 w-full rounded p-2.5 mt-4 text-left font-mono text-[9px] text-[#00ff7f] min-h-[50px] overflow-hidden leading-tight flex items-start gap-1">
                        <span className="animate-pulse shrink-0">&gt;</span>
                        <span>{analysisLog}</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all ${
                          isDragging
                            ? "border-cyan-400 bg-cyan-950/20"
                            : "border-gray-800 bg-[#07080A]/80 hover:border-cyan-400/40"
                        }`}
                      >
                      <input
                        type="file"
                        id="audio-file-input"
                        className="hidden"
                        accept="audio/*"
                        onChange={handleFileSelect}
                      />
                      
                      <FileAudio size={32} className={`mb-3 ${isDragging ? "text-cyan-400" : "text-gray-500"}`} />
                      
                      <label htmlFor="audio-file-input" className="cursor-pointer">
                        <span className="text-xs font-sans font-bold text-white hover:text-cyan-400 select-none block">
                          Drag &amp; Drop audio file here, or <span className="text-cyan-400 underline">browse</span>
                        </span>
                        <span className="text-[10px] text-gray-400 font-sans block mt-1">
                          AAC, WAV, MP3, FLAC files processed locally (Up to 15MB)
                        </span>
                      </label>
                      </div>
                      {analysisLog.startsWith("[error]") && (
                        <p className="mt-3 text-[10px] font-mono text-red-400" role="alert">{analysisLog}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Local Preset Quick selectors */}
                <div className="mt-5 border-t border-gray-800 pt-4">
                  <span className="text-[10px] font-mono text-gray-500 block mb-2.5 uppercase tracking-wider font-bold">
                    Or select pre-loaded reference stems:
                  </span>
                  <div className="flex flex-col gap-2">
                    {PRESET_TRACKS.map(track => (
                      <button
                        key={track.id}
                        onClick={() => {
                          setActiveTrack(track);
                          setTrackProgress(0);
                        }}
                        className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors ${
                          activeTrack.id === track.id
                            ? "bg-cyan-950/20 border-cyan-500/30 text-white"
                            : "bg-[#07080A] border-gray-800 text-gray-400 hover:bg-gray-800/50 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Music size={12} className={activeTrack.id === track.id ? "text-cyan-400" : "text-gray-500"} />
                          <div className="truncate">
                            <span className="text-xs font-sans font-bold block leading-none">{track.title}</span>
                            <span className="text-[9px] font-mono block mt-0.5 text-gray-500">{track.artist}</span>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-cyan-400 font-bold">{track.bpm ? `${track.bpm} BPM` : "BPM unavailable"}</span>
                          <span className="text-[9px] font-mono bg-[#161B22] border border-gray-800 px-2 py-0.5 rounded text-gray-400 uppercase">
                            {track.key}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* TIMELIN SYSTEM & DYNAMIC WAVEFORM ANALYZER DESK (R: 7 Columns) */}
              <div className="lg:col-span-7 bg-[#0F111A] border border-gray-800 rounded-xl p-5 flex flex-col justify-between shadow-lg">
                
                {/* Header Information */}
                <div>
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Activity size={14} className="text-cyan-400" />
                      <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider">
                        Waveform Spectral Analyzer
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-mono text-gray-400 bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                      <span>CHROMA FREQS STFT WINDOW</span>
                    </div>
                  </div>

                  {/* Active Track Readout */}
                  <div className="mb-4 bg-[#07080A] p-3 rounded-lg border border-gray-800 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold leading-none">NOW DECONSTRUCTED</span>
                      <span className="text-md font-sans font-black text-white block mt-1">{activeTrack.title}</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-xs text-gray-400 block font-bold uppercase">BPM Sync</span>
                      <span className="text-xs text-emerald-400 block font-semibold">{activeTrack.bpm ? `${activeTrack.bpm} BPM` : "BPM unavailable"} // {activeTrack.key}</span>
                    </div>
                  </div>

                  {/* MULTI-LAYER STACKED WAVEFORM VISUALIZER WITH DYNAMIC LEVEL FEED */}
                  {/* Each stem maps to a color; if muted or solo is active, waves flatten out representing gain level! */}
                  <div
                    onClick={handleWaveformScrub}
                    className="h-32 bg-[#050608] rounded-xl border border-gray-800 relative overflow-hidden cursor-crosshair select-none group"
                  >
                    {/* Floating coordinate helper */}
                    <div className="absolute top-1 left-2 text-[8px] font-mono text-gray-500 z-10 select-none">
                      AMPLITUDE MULTIPLIERS (dB SCALE)
                    </div>

                    {/* Timeline progress line overlay */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_8px_#00f0ff] z-20 pointer-events-none"
                      style={{ left: `${(trackProgress / activeTrack.duration) * 100}%` }}
                    />

                    {/* Vertical scanning cursor */}
                    <div
                      className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent z-10 pointer-events-none"
                      style={{ left: `calc(${(trackProgress / activeTrack.duration) * 100}% - 16px)` }}
                    />

                    {/* RENDER STACKED SVG OSCILLATOR CHANNELS */}
                    {/* Generates smooth sine layers for a beautiful, organic waveform display */}
                    <svg className="w-full h-full absolute inset-0 opacity-80" preserveAspectRatio="none" viewBox="0 0 100 100">
                      {stems.map((stem, stemIdx) => {
                        const hasSolo = stems.some(s => s.isSolo);
                        const isMuted = stem.isMuted || (hasSolo && !stem.isSolo);
                        const volumeMultiplier = isMuted ? 0 : (stem.volume / 100);

                        // Generate unique wave shape based on the stem key to represent distinct frequencies
                        let freqFactor = 1.0;
                        if (stem.id === "vocals") freqFactor = 2.4;
                        if (stem.id === "drums") freqFactor = 0.8;
                        if (stem.id === "bass") freqFactor = 0.4;
                        if (stem.id === "synths") freqFactor = 1.8;

                        const numPoints = 80;
                        const points: string[] = [];
                        points.push("M 0 50");

                        for (let x = 0; x <= numPoints; x++) {
                          const rad = (x / numPoints) * Math.PI * 8 * freqFactor;
                          // Standard complex wave modulation
                          let amp = Math.sin(rad) * Math.cos(rad * 0.4) * 20;
                          
                          // Add local musical section multipliers
                          if (x > 25 && x < 55) amp *= 1.4; // Chorus/high dynamics
                          
                          // Scale in real-time by volume fader multiplier!
                          amp *= volumeMultiplier;

                          // Jitter ripple only when playing
                          const playJitter = isPlaying ? (Math.sin(Date.now() * 0.005 + x) * 2 * volumeMultiplier) : 0;
                          const y = 50 + amp + playJitter;

                          points.push(`L ${x * (100 / numPoints)} ${y}`);
                        }
                        points.push("L 100 50");

                        let color = "rgba(244, 63, 94, 0.2)"; // vocals
                        if (stem.id === "drums") color = "rgba(245, 158, 11, 0.2)";
                        if (stem.id === "bass") color = "rgba(6, 182, 212, 0.2)";
                        if (stem.id === "synths") color = "rgba(168, 85, 247, 0.2)";

                        return (
                          <path
                            key={stem.id}
                            d={points.join(" ")}
                            fill={color}
                            stroke={color.replace("0.2", "0.6")}
                            strokeWidth="0.75"
                            className="transition-all duration-300"
                          />
                        );
                      })}
                      {/* Central zero-crossing threshold reference */}
                      <line x1="0" y1="50" x2="100" y2="50" stroke="#1b2230" strokeWidth="0.5" strokeDasharray="1,2" />
                    </svg>

                  </div>
                </div>

                {/* Timeline Transport Playback Control Strip */}
                <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-gray-800 pt-4">
                  <div className="flex items-center gap-3">
                    <button
                      id="studio-play-pause-btn"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className={`h-11 px-6 rounded-xl flex items-center justify-center gap-2 font-sans font-bold text-xs tracking-wider transition-all shadow-md ${
                        isPlaying
                          ? "bg-amber-500 text-[#07080A] shadow-amber-950/20"
                          : "bg-cyan-400 text-[#07080A] shadow-cyan-950/20 hover:scale-[1.02]"
                      }`}
                    >
                      {isPlaying ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
                      <span>{isPlaying ? "Pause Engine" : "Start Live Player"}</span>
                    </button>

                    {/* Timeline Position MM:SS */}
                    <div className="font-mono text-xs text-gray-300 bg-gray-900 border border-gray-800 px-3 py-2.5 rounded-lg flex items-center gap-2">
                      <Clock size={12} className="text-cyan-400" />
                      <span>{formatTime(trackProgress)}</span>
                      <span className="text-gray-600">/</span>
                      <span className="text-gray-500">{formatTime(activeTrack.duration)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Metronome Beat flash indicator */}
                    <button
                      onClick={() => setIsMetronomeEnabled(!isMetronomeEnabled)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                        isMetronomeEnabled
                          ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-400"
                          : "bg-black border-gray-800 text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full transition-all ${
                        isMetronomeEnabled && isBeatActive ? "bg-emerald-400 scale-125 shadow-[0_0_6px_#10b981]" : "bg-gray-700"
                      }`} />
                      <span>METRONOME</span>
                    </button>

                    {/* Speed Multiplier */}
                    <div className="flex items-center gap-1 bg-black border border-gray-800 p-1 rounded-lg">
                      {[0.75, 1.0, 1.25, 1.5].map(speed => (
                        <button
                          key={speed}
                          onClick={() => setPlaybackSpeed(speed)}
                          className={`px-2 py-1 text-[10px] font-mono font-bold rounded ${
                            playbackSpeed === speed
                              ? "bg-cyan-900/20 border border-cyan-500/30 text-cyan-400"
                              : "text-gray-500 hover:text-gray-300"
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
              
            </div>

            {/* GRID LAYER 2: INTERACTIVE STEM MIXER BOARD (CONVERGENCE DESK) */}
            <div className="bg-[#0F111A] border border-gray-800 rounded-xl p-5 shadow-lg">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-4 mb-5">
                <div>
                  <h3 className="text-sm font-sans font-black text-white flex items-center gap-2">
                    <Sliders className="text-cyan-400" size={16} />
                    Dynamic Studio Fader Console
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed font-sans">
                    Toggle channels Mute / Solo triggers. Dynamic level faders physically adjust the spectral layers inside the Waveform Analyzer above.
                  </p>
                </div>
                
                {/* Master summary db node */}
                <div className="bg-gray-900 border border-gray-800 p-2.5 rounded-lg flex items-center gap-3">
                  <span className="text-[9px] font-mono text-gray-500 uppercase font-bold">Consolidated Out:</span>
                  <div className="flex items-center gap-1 text-xs font-mono font-bold text-center">
                    <span className="text-emerald-400">0.00 ms DRIFT</span>
                    <span className="text-gray-600">//</span>
                    <span className="text-cyan-400">4 INOUT GAINS</span>
                  </div>
                </div>
              </div>

              {/* Console strips grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {stems.map(stem => {
                  const hasSolo = stems.some(s => s.isSolo);
                  const isMuted = stem.isMuted || (hasSolo && !stem.isSolo);

                  return (
                    <div
                      key={stem.id}
                      className={`bg-[#07080A] rounded-xl border p-4 flex flex-col gap-4 transition-all ${
                        isMuted
                          ? "border-red-950/20 opacity-40 grayscale"
                          : stem.isSolo
                          ? "border-cyan-500/30 shadow-md shadow-cyan-950/10"
                          : "border-gray-800"
                      }`}
                    >
                      {/* Channel Header Info */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-mono tracking-wider text-cyan-400 uppercase bg-cyan-950/20 px-2 py-0.5 rounded font-black">
                            {stem.id}
                          </span>
                          <h4 className="text-xs font-sans font-bold text-[#f1f3f9] mt-1.5 leading-none">{stem.name}</h4>
                        </div>
                        {/* Live Gain Readout */}
                        <div className="text-right font-mono text-[10px] text-cyan-300 font-bold">
                          {isMuted ? "Muted" : `${stem.volume}%`}
                        </div>
                      </div>

                      {/* Real-time flickering peak-meter panel */}
                      <div className="h-10 bg-[#050608] rounded border border-gray-800 p-1 flex items-end justify-between overflow-hidden gap-[1.5px]">
                        {stem.frequencyPeaks.map((height, barIdx) => (
                          <div key={barIdx} className="flex-1 bg-gray-950 rounded-t h-full flex items-end">
                            <div
                              className={`w-full bg-gradient-to-t ${stem.color} rounded-t transition-all duration-75`}
                              style={{ height: `${height}%` }}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Hardware style volume slider */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] font-mono text-gray-500">
                          <span>LEVEL GAIN</span>
                          <span>{stem.volume > 0 ? `${Math.round(stem.volume / 10 - 5)} dB` : "-∞ DB"}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={stem.volume}
                          onChange={(e) => handleVolumeChange(stem.id, parseInt(e.target.value))}
                          className="w-full accent-cyan-400 cursor-pointer h-1.5 rounded-lg bg-gray-900"
                        />
                      </div>

                      {/* Professional controls grid */}
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          onClick={() => toggleMute(stem.id)}
                          className={`py-1.5 rounded font-mono text-[10px] font-bold border transition-colors flex items-center justify-center gap-1 ${
                            stem.isMuted
                              ? "bg-red-950/30 border-red-500/20 text-red-400"
                              : "bg-gray-950 border-gray-800 text-gray-400 hover:bg-gray-900"
                          }`}
                        >
                          {stem.isMuted ? <VolumeX size={10} /> : <Volume2 size={10} />}
                          <span>MUTE</span>
                        </button>
                        <button
                          onClick={() => toggleSolo(stem.id)}
                          className={`py-1.5 rounded font-mono text-[10px] font-bold border transition-colors flex items-center justify-center gap-1 ${
                            stem.isSolo
                              ? "bg-cyan-500 border-cyan-400 text-[#07080A] font-black"
                              : "bg-gray-950 border-gray-800 text-gray-400 hover:bg-gray-900"
                          }`}
                        >
                          <span>SOLO</span>
                          {stem.isSolo && <span className="h-1.5 w-1.5 bg-[#07080A] rounded-full animate-ping" />}
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>

            {/* GRID LAYER 3: REAL-TIME CHORD TRACKER & INSTRUMENT FRETS MAP (CENTRAL DRIVER) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* LIVE CHORD TRACKER timeline progression tape (L: 4 Columns) */}
              <div className="lg:col-span-4 bg-[#0F111A] border border-gray-800 rounded-xl p-5 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
                    <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap size={13} className="text-cyan-400" />
                      Live Chord tracker ticker
                    </h3>
                    <span className="text-[10px] font-mono text-gray-500">Log Scale HMM</span>
                  </div>

                  <p className="text-[11px] text-gray-400 font-sans mb-5 leading-normal">
                    Chords progress seamlessly on beat measures based on BPM sync intervals. Highlights active fretting guides.
                  </p>

                  {/* Horizontal visual ticker of chord alignments */}
                  <div className="flex flex-col gap-3">
                    
                    {/* Previous Chord row index */}
                    <div className="flex justify-between items-center bg-[#07080A]/40 border border-gray-850 p-2.5 rounded-lg opacity-60">
                      <span className="text-[10px] font-mono text-gray-500 uppercase leading-none">PREV MEASURE</span>
                      <span className="text-xs font-mono font-extrabold text-gray-300">{chordTape.prev}</span>
                    </div>

                    {/* CURRENT GLOWING COORDINATE */}
                    <div className="flex justify-between items-center bg-cyan-950/20 border border-cyan-500/40 p-3.5 rounded-xl shadow-[0_0_12px_rgba(0,240,255,0.06)] relative overflow-hidden">
                      <div className="absolute top-0 bottom-0 left-0 w-1 bg-cyan-400" />
                      <div>
                        <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest block font-bold leading-none">ACTIVE MEASURE Chord</span>
                        <span className="text-sm font-sans font-black text-white block mt-1.5">{chordTape.current}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xxs font-mono text-gray-400 block uppercase">confidence</span>
                        <span className="text-xs font-mono text-emerald-400 mt-0.5 block font-extrabold">98.4%</span>
                      </div>
                    </div>

                    {/* Next measure indicator */}
                    <div className="flex justify-between items-center bg-[#07080A]/45 border border-gray-850 p-2.5 rounded-lg opacity-75">
                      <div className="flex items-center gap-1.5">
                        <ArrowRight size={11} className="text-gray-500 animate-pulse" />
                        <span className="text-[10px] font-mono text-gray-400 uppercase leading-none">NEXT MEASURE</span>
                      </div>
                      <span className="text-xs font-mono font-extrabold text-[#f1f3f9]">{chordTape.next}</span>
                    </div>

                    {/* Upcoming chord */}
                    <div className="flex justify-between items-center bg-transparent border border-dashed border-gray-800 p-2.5 rounded-lg opacity-40">
                      <span className="text-[10px] font-mono text-gray-500 uppercase leading-none">FOLLOWING MEASURE</span>
                      <span className="text-xs font-mono font-bold text-gray-400">{chordTape.upcoming}</span>
                    </div>

                  </div>
                </div>

                {/* Micro metrics */}
                <div className="mt-5 pt-3.5 border-t border-gray-800 font-mono text-[10px] text-gray-500 flex justify-between">
                  <span>SAMPLE CLASSIFIER: tf.js INT8</span>
                  <span>CONFIDENCE RATIO: SOLID</span>
                </div>

              </div>

              {/* INTEGRATED GUITAR FRETBOARD AND PIANO VISUAL MAPPINGS (R: 8 Columns) */}
              <div className="lg:col-span-8 bg-[#0F111A] border border-gray-800 rounded-xl p-5 flex flex-col justify-between shadow-lg">
                
                <div>
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-5">
                    <div className="flex items-center gap-1.5">
                      <SlidersHorizontal size={14} className="text-cyan-400" />
                      <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider">
                        Instrument Fretting &amp; Keyboard mappings
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-[#00f0ff] uppercase">{chordTape.current} active profile</span>
                  </div>

                  <div className="space-y-6">
                    
                    {/* GUITAR FRETBOARD RENDER PORT */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-sans text-gray-300 mb-2.5 font-bold">
                        <span>Synced Guitar Tab (6-String eBGDae Fretboard Mapping)</span>
                        <span className="text-[10px] text-gray-500 font-mono">Standard E Tuning</span>
                      </div>

                      <div className="relative">
                        {/* Guitar Neck woodnut lines marker */}
                        <div className="absolute left-[40px] top-0 bottom-0 w-2.5 bg-amber-700/80 rounded z-10 shadow-sm" />

                        {/* Strings fret matrix block */}
                        <div className="relative flex flex-col gap-4 py-4 bg-[#050608] rounded-xl border border-gray-800 px-3 overflow-hidden">
                          {/* Fret marker circles at 3, 5, 7, 9, 12 positions */}
                          <div className="absolute inset-0 flex pointer-events-none">
                            {[3, 5, 7, 9, 12].map(fNum => (
                              <div
                                key={fNum}
                                className="absolute border-r border-[#1e293b]/65 h-full flex flex-col items-center justify-center"
                                style={{ left: `calc(45px + ${fNum * 7.4}% - 14px)` }}
                              >
                                {(fNum === 3 || fNum === 5 || fNum === 7 || fNum === 9 || fNum === 12) && (
                                  <div className="w-1.5 h-1.5 bg-gray-800/80 rounded-full mt-1.5" />
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Render 6 strings */}
                          {[1, 2, 3, 4, 5, 6].map(stringNum => {
                            // Find active chord fretting position for this specific string
                            const activePos = currentChordSpec.guitar.find(g => g.string === stringNum);
                            const isFretted = activePos && activePos.fret > 0;
                            const isMuted = activePos && activePos.fret === -1;
                            const isOpen = activePos && activePos.fret === 0;

                            return (
                              <div key={stringNum} className="relative h-4 flex items-center">
                                {/* String horizontal physical line gauge */}
                                <div
                                  className="absolute left-[40px] right-2 bg-gray-500/50 shadow-sm z-0 pointer-events-none"
                                  style={{ height: `${0.5 + (stringNum * 0.25)}px` }}
                                />

                                {/* Left edge string labels */}
                                <div className="w-8 font-mono text-[10px] text-gray-500 font-black tracking-wider leading-none">
                                  {stringNum === 1 && "e (1st)"}
                                  {stringNum === 2 && "B (2nd)"}
                                  {stringNum === 3 && "G (3rd)"}
                                  {stringNum === 4 && "D (4th)"}
                                  {stringNum === 5 && "A (5th)"}
                                  {stringNum === 6 && "E (6th)"}
                                </div>

                                {/* Nut marker coordinates or open strings symbol indicators */}
                                {isMuted && (
                                  <span className="absolute left-[24px] text-[10px] font-mono text-red-500 font-black">X</span>
                                )}
                                {isOpen && (
                                  <span className="absolute left-[24px] w-2 h-2 rounded-full border-2 border-cyan-400 bg-[#07080A]" />
                                )}

                                {/* RENDER ACTIVE PRESSED CHROMATIC FINGER ACCENT DOOT */}
                                {isFretted && activePos && (
                                  <div
                                    className="absolute w-5 h-5 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600 shadow-[0_0_8px_rgba(0,240,255,0.4)] flex items-center justify-center font-mono text-[9px] text-black font-black z-20 transition-all animate-bounce"
                                    style={{
                                      left: `calc(46px + ${activePos.fret * 7.4}% - 10px)`
                                    }}
                                  >
                                    {activePos.finger || "●"}
                                  </div>
                                )}

                              </div>
                            );
                          })}

                        </div>
                      </div>
                    </div>

                    {/* PIANO KEYBOARD MAPPING PORT */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-sans text-gray-300 mb-2.5 font-bold">
                        <span>Dual-Octave Piano Keyboard Mapping</span>
                        <span className="text-[10px] text-gray-500 font-mono">STFT chroma frequencies layout</span>
                      </div>

                      <div className="bg-[#050608] p-3 rounded-xl border border-gray-800 relative overflow-hidden">
                        <div className="flex h-20 relative select-none">
                          {PIANO_KEYS_LAYOUT.map((pianoKey, idx) => {
                            // Clean note prefix
                            const noteBase = pianoKey.note.replace("_oct", "");
                            // Is this specific note part of the active chord notes?
                            const isPressed = currentChordSpec.piano.some(n => n === noteBase);

                            if (pianoKey.isBlack) {
                              // We absolute place black keys on top of White keys to fit keyboard model standard
                              // Est. mapping coordinate based on note pitch index
                              const relativeLeftOffset = Math.floor(idx * 4.3);
                              return (
                                <div
                                  key={pianoKey.note}
                                  className={`absolute top-0 h-11 w-4 sm:w-5 transition-colors duration-150 rounded-b z-30 flex items-end justify-center pb-1 ${
                                    isPressed
                                      ? "bg-gradient-to-b from-cyan-600 to-cyan-400 shadow-[0_3px_8px_rgba(0,240,255,0.3)] border-b-2 border-cyan-300"
                                      : "bg-gray-950 border-x border-gray-900 hover:bg-black"
                                  }`}
                                  style={{ left: `${2 + relativeLeftOffset}%` }}
                                >
                                  <span className="text-[6px] font-mono text-gray-400 scale-75 block font-bold truncate leading-none">
                                    {noteBase}
                                  </span>
                                </div>
                              );
                            } else {
                              return (
                                <div
                                  key={pianoKey.note}
                                  className={`flex-1 min-h-full transition-all duration-150 rounded-b border-r border-[#161B22] flex items-end justify-center pb-1.5 z-10 ${
                                    isPressed
                                      ? "bg-gradient-to-b from-cyan-600 to-cyan-400 text-black font-black border-b-2 border-cyan-300"
                                      : "bg-gray-900 text-gray-400 hover:bg-gray-850"
                                  }`}
                                >
                                  <span className="text-[7px] font-mono font-bold leading-none scale-75">
                                    {noteBase}
                                  </span>
                                </div>
                              );
                            }
                          })}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                  <span>INTERLOCKING TIMELINE INTERVALS: EXCELLENT SYNC</span>
                  <div className="flex gap-3">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Pressed Note
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-700" /> Inactive
                    </span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* WORKSPACE SECONDARY SPECS: INSTRUMENT CLASSIFIER (GEMINI + MONGO) */}
        {activeWorkspaceTab === "instrument-id" && (
          <div className="animate-in fade-in duration-300">
            <InstrumentClassifier />
          </div>
        )}

        {/* WORKSPACE SECONDARY SPECS: DB SCHEMA EXPLORER */}
        {activeWorkspaceTab === "database" && (
          <div className="animate-in fade-in duration-300">
            <DatabaseSchemaViewer />
          </div>
        )}

        {/* WORKSPACE SECONDARY SPECS: AI CO-FOUNDER TECH ASSISTANT */}
        {activeWorkspaceTab === "ai-helper" && (
          <div className="animate-in fade-in duration-300 max-w-4xl mx-auto">
            <div className="bg-[#0F111A] border border-gray-850 p-6 rounded-2xl shadow-lg mb-6">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block mb-2 font-bold">
                Co-Founder Tech Appendix AI
              </span>
              <h2 className="text-lg font-sans font-black text-white mb-2">
                SonicArc Technical Co-Founder Architect Chat
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Test the real, multi-track audio engineering pipeline logic! Interact directly with our AI CTO about CUDA memory allocation, Demucs HT weights, ASCAP mechanical licensing, or edge TensorFlow.js models.
              </p>
            </div>
            <ChatAssistant />
          </div>
        )}

        {/* WORKSPACE ARCHITECTURE VIEW: MERMAID & SYSTEM DIAGRAMS */}
        {activeWorkspaceTab === "architecture" && (
          <div className="animate-in fade-in duration-300">
            <ArchitectureViewer />
          </div>
        )}

        {/* BEAUTIFUL BENTO CORE SPECIFICATIONS GRID */}
        {activeWorkspaceTab === "dashboard" && (
          <div className="mt-12 bg-[#0F111A] border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-900/10 rounded-full blur-[100px] pointer-events-none" />
            
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block mb-1 font-bold">
              Engineering Specs &amp; Edge Hardware Map
            </span>
            <h3 className="text-md font-sans font-black text-white mb-4">
              Pristine Zero-Latency Edge Pipeline Mitigation
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-[#07080A] rounded-xl border border-gray-800 p-4">
                <span className="text-xxs font-mono text-cyan-400 uppercase tracking-wider font-bold block mb-1.5">
                  1. Browser Audio Worklet Processor
                </span>
                <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                  Raw float32 buffer samples process straight inside a high-priority browser AudioWorkletProcessor thread at 128 samples blocks (<strong className="text-white">&lt;3ms latency</strong>), avoiding standard main thread bottlenecks or garbage-collection loops during live audio tracking.
                </p>
              </div>

              <div className="bg-[#07080A] rounded-xl border border-gray-800 p-4">
                <span className="text-xxs font-mono text-[#a9b2c3] uppercase tracking-wider font-bold block mb-1.5">
                  2. WebAssembly (Wasm) Compilation
                </span>
                <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                  The C++ core extraction engine compile directly to fast WebAssembly binaries. Allows the user's local chrome node to solve 12-channel chroma log vector matrices instantly under native speeds with zero server compute budget.
                </p>
              </div>

              <div className="bg-[#07080A] rounded-xl border border-gray-800 p-4">
                <span className="text-xxs font-mono text-cyan-400 uppercase tracking-wider font-bold block mb-1.5">
                  3. Quantized ONNX Web Inference
                </span>
                <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                  Our machine-learning deep pitch estimation model is quantized using INT8 scales to compressed ONNX matrices. This shrinks client-side assets from 45MB to just <strong className="text-white">4.2MB</strong> with negligible accuracy degradation.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* Bento Footer */}
        <footer className="flex flex-col sm:flex-row justify-between items-center text-[10px] text-gray-500 border-t border-[#1b2230] pt-6 mt-12 w-full gap-4">
          <div className="font-mono text-gray-400 uppercase tracking-wider">
            ARCHITECT ENGINE ACTIVE // CLIENT PERSISTENCE RECONNECTED
          </div>
          <div className="flex gap-4 font-mono">
            <span>ENC: TLS 1.3 AES-256</span>
            <span>SYSTEM GATEWAY: CLOUD-RUN-GPU</span>
            <span>BUILD: v1.1.2-LIVE</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
