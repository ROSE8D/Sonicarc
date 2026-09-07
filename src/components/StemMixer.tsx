import React, { useState, useEffect, useRef } from "react";
import { Sliders, Volume2, VolumeX, Radio, Music, Play, Square, Info } from "lucide-react";

interface StemChannel {
  id: string;
  name: string;
  color: string;
  volume: number; // 0 to 100
  isMuted: boolean;
  isSolo: boolean;
  frequencyData: number[]; // real-time visual bouncing heights
}

export function StemMixer() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [stems, setStems] = useState<StemChannel[]>([
    { id: "vocals", name: "Vocals (Lead & Harmonies)", color: "from-pink-500 to-rose-400", volume: 85, isMuted: false, isSolo: false, frequencyData: new Array(16).fill(10) },
    { id: "drums", name: "Drums (Percussion Base)", color: "from-amber-500 to-orange-400", volume: 90, isMuted: false, isSolo: false, frequencyData: new Array(16).fill(15) },
    { id: "bass", name: "Bass Guitar (Low Frequency)", color: "from-cyan-500 to-blue-400", volume: 80, isMuted: false, isSolo: false, frequencyData: new Array(16).fill(5) },
    { id: "other", name: "Other (Guitars & Piano synth)", color: "from-purple-500 to-indigo-400", volume: 75, isMuted: false, isSolo: false, frequencyData: new Array(16).fill(8) }
  ]);
  const [selectedPreset, setSelectedPreset] = useState<string>("electro-rock");

  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      animateFrequencyPeaks();
    } else {
      stopFrequencyPeaks();
    }
    return () => stopFrequencyPeaks();
  }, [isPlaying]);

  const animateFrequencyPeaks = () => {
    setStems(prevStems => {
      // Find if anyone is soloed
      const hasSolo = prevStems.some(s => s.isSolo);

      return prevStems.map(stem => {
        // If muted or someone else is soloed, flatten frequency animation
        const isEffectivelyMuted = stem.isMuted || (hasSolo && !stem.isSolo);
        if (isEffectivelyMuted) {
          return { ...stem, frequencyData: stem.frequencyData.map(v => Math.max(0, v - 2)) };
        }

        // Bouncing heights based on channel properties
        const volumeMultiplier = stem.volume / 100;
        const newFreqs = stem.frequencyData.map((v, i) => {
          let base = 5;
          // Different shapes per stem channel characteristics
          if (stem.id === "vocals") base = Math.sin(Date.now() * 0.003 + i) * 35 + 45;
          else if (stem.id === "drums") base = (i % 3 === 0 ? 70 : 15) + Math.cos(Date.now() * 0.007 + i) * 20;
          else if (stem.id === "bass") base = Math.cos(Date.now() * 0.002 + i) * 45 + 25;
          else base = Math.sin(Date.now() * 0.005 + i * 2) * 30 + 40;

          // Introduce random offsets and scale by channel volume
          const noise = Math.random() * 15 - 7.5;
          return Math.max(6, Math.min(100, Math.floor((base + noise) * volumeMultiplier)));
        });

        return { ...stem, frequencyData: newFreqs };
      });
    });

    animFrameId.current = requestAnimationFrame(animateFrequencyPeaks);
  };

  const stopFrequencyPeaks = () => {
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }
    // Return all to stationary base
    setStems(prev => prev.map(s => ({ ...s, frequencyData: s.frequencyData.map(() => 4) })));
  };

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

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="bg-[#161B22] rounded-xl border border-gray-800 p-6 shadow-xl" id="stems-separator-mixer">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sliders className="text-cyan-400" size={18} />
            <h3 className="text-lg font-sans font-medium text-white">Interactive Virtual Stem Separation Mixer</h3>
          </div>
          <p className="text-xs text-gray-400 max-w-xl">
            Simulate the output of our AI pipeline. Toggle Mute or Solo, and slide stem volumes to inspect client-side audio consolidation.
          </p>
        </div>

        {/* Playback Controls & Presets */}
        <div className="flex items-center gap-3">
          <select
            id="stems-preset-selector"
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
            className="bg-[#0B0C10] border border-gray-800 text-xs px-3 py-1.5 rounded-lg text-gray-300 font-sans focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="electro-rock">Electro Rock (4 Stems)</option>
            <option value="jazz-trio">Jazz Funk Trio (4 Stems)</option>
            <option value="acoustic-soul">Acoustic Soul (4 Stems)</option>
          </select>

          <button
            id="toggle-playback-stems"
            onClick={togglePlay}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${
              isPlaying
                ? "bg-amber-600 text-white shadow-lg shadow-amber-950/20 border border-amber-500/20"
                : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-950/20 border border-cyan-500/30"
            }`}
          >
            {isPlaying ? <Square size={13} className="mr-0.5" /> : <Play size={13} className="mr-0.5" />}
            {isPlaying ? "Pause Session" : "Play Session"}
          </button>
        </div>
      </div>

      {/* Mixer Board channels */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {stems.map((stem) => {
          const hasSolo = stems.some(s => s.isSolo);
          // Check if stem is effectively active
          const isEffectivelyMuted = stem.isMuted || (hasSolo && !stem.isSolo);

          return (
            <div
              key={stem.id}
              className={`bg-[#0B0C10] rounded-xl border p-4 flex flex-col gap-4 transition-all ${
                isEffectivelyMuted
                  ? "border-red-950/30 opacity-40 grayscale"
                  : stem.isSolo
                  ? "border-cyan-500/30 shadow-md shadow-cyan-950/10"
                  : "border-gray-800"
              }`}
            >
              {/* Channel Header (Name) */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 capitalize bg-[#161B22] border border-gray-800 px-2 py-0.5 rounded font-bold">
                    {stem.id}
                  </span>
                  <h4 className="text-xs font-sans font-semibold text-gray-200 mt-1 truncate max-w-[130px]">{stem.name}</h4>
                </div>
                
                {/* Audio active pulse */}
                <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 font-semibold">
                  <span className={`h-1.5 w-1.5 rounded-full ${isPlaying && !isEffectivelyMuted ? "bg-cyan-400 animate-ping" : "bg-gray-700"}`} />
                  {stem.volume}%
                </div>
              </div>

              {/* Real-time sub-channel wave visualizer */}
              <div className="h-16 bg-[#050608] rounded-lg p-2 border border-gray-800 flex items-end justify-between overflow-hidden gap-[2px]">
                {stem.frequencyData.map((height, i) => (
                  <div key={i} className="flex-1 bg-slate-900 rounded-t h-full flex items-end">
                    <div
                      className={`w-full bg-gradient-to-t ${stem.color} rounded-t transition-all duration-100`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                ))}
              </div>

              {/* Slider Component */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span className="font-mono">Fader DB Level</span>
                  <span>{stem.volume > 0 ? `${Math.round(stem.volume / 10 - 5)} dB` : "-∞ DB"}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={stem.volume}
                  onChange={(e) => handleVolumeChange(stem.id, parseInt(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Interactive Audio controls M/S (Mute Solo) */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => toggleMute(stem.id)}
                  className={`py-1 rounded font-mono text-[10px] font-bold border transition-all flex items-center justify-center gap-1 ${
                    stem.isMuted
                      ? "bg-red-500/20 text-red-400 border-red-500/30"
                      : "bg-[#161B22] text-gray-400 border-gray-800 hover:bg-gray-800"
                  }`}
                >
                  {stem.isMuted ? <VolumeX size={10} /> : <Volume2 size={10} />}
                  MUTE
                </button>
                <button
                  onClick={() => toggleSolo(stem.id)}
                  className={`py-1 rounded font-mono text-[10px] font-bold border transition-all flex items-center justify-center gap-1 ${
                    stem.isSolo
                      ? "bg-cyan-600 text-white border-cyan-500"
                      : "bg-[#161B22] text-gray-400 border-gray-800 hover:bg-gray-800"
                  }`}
                >
                  SOLO {stem.isSolo && "●"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Client implementation technology guide footer */}
      <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10 flex flex-col md:flex-row md:items-center gap-4 justify-between" id="stems-mixing-client-spec">
        <div className="flex items-start gap-2.5">
          <Info className="text-cyan-400 flex-shrink-0 mt-0.5" size={16} />
          <div>
            <h4 className="text-xs font-semibold text-cyan-300">Client-side Multi-Track Player Implementation:</h4>
            <p className="text-xxs text-gray-300 leading-relaxed mt-0.5">
              To guarantee zero phase drift or stutter, we instantiate a single Web Audio <code className="text-cyan-400 font-mono">AudioContext</code> and link four distinct <code className="text-cyan-400 font-mono">GainNodes</code> (mapped to state sliders) back to a unified master destination.
            </p>
          </div>
        </div>
        <div className="bg-[#0B0C10] border border-gray-800 rounded-lg px-4 py-2 flex items-center gap-2">
          <span className="text-[10px] font-mono text-gray-400">SYNC INTRINSIC LATENCY</span>
          <span className="text-xs font-sans font-extrabold text-emerald-400">0.00ms</span>
        </div>
      </div>

    </div>
  );
}
export default StemMixer;
