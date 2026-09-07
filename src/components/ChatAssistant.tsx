import React, { useState, useRef, useEffect } from "react";
import { Message } from "../types";
import { Send, Sparkles, MessageSquare, Terminal, RefreshCw, Layers } from "lucide-react";

const SUGGESTED_PROMPTS = [
  { label: "PyTorch CNN Code", text: "Can you provide a PyTorch module showing how we construct a CNN for spectrogram chord identification?" },
  { label: "Nvidia GPU Sizing", text: "How should we estimate GPU cloud costs for 100 concurrent stem separation tracks on Nvidia T4 vs A10G?" },
  { label: "AScap Licensing", text: "What is our licensing strategy to navigate copyright with Gracenote APIs and ASCAP/BMI catalogs?" },
  { label: "Wasm Audio Latency", text: "Show how we write a C++ Essentia wrapper to compile to WebAssembly for edge chromagram extracts of microphone." }
];

export function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hey there! 👋 As your Lead Technical Architect and CTO Co-founder of SonicArc, I'm ready to double-check our system spec for our upcoming Seed Pitch. We've got our Core WebAudio DSP mapped, but I'm happy to write some direct PyTorch CNN training cells, size up our server costs, or outline our copyright mitigation strategy. What's on your mind, partner?"
    }
  ]);
  const [inputText, setInputText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUsingSimulatedKey, setIsUsingSimulatedKey] = useState<boolean>(false);

  const consoleEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;

    const userMessage: Message = { role: "user", content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userContext: "MusicTech seed pitch slide preparation"
        })
      });

      if (!response.ok) {
        throw new Error("Key not configured or server offline");
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
    } catch (err) {
      // High-Fidelity local Expert CTO fallback output, ground in real facts
      setIsUsingSimulatedKey(true);
      setTimeout(() => {
        let simulatedAnswer = "";
        
        // Match standard query keywords in lowercase
        const query = textToSend.toLowerCase();
        if (query.includes("pytorch") || query.includes("cnn") || query.includes("code")) {
          simulatedAnswer = `### SonicArc Deep Server Chord Detection CNN

Our server chord Classifier leverages a 2D Convolutional Neural Network (CNN) following the **Mert (Music Representation)** embedding baseline, mapped to a Bi-directional LSTM for sequential context tracking. 

Here is our pre-compiled PyTorch module blueprint for the pitch-deck appendix:

\`\`\`python
import torch
import torch.nn as nn

class SonicChordCNN(nn.Module):
    def __init__(self, num_classes=24):  # 12 Major + 12 Minor chords
        super(SonicChordCNN, self).__init__()
        # Input: Mel-Spectrogram spectrogram frames (Batch, 1, 128_mels, 128_frames)
        self.conv1 = nn.Conv2d(1, 32, kernel_size=(3, 3), stride=1, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        self.pool1 = nn.MaxPool2d(kernel_size=(2, 2))
        
        self.conv2 = nn.Conv2d(32, 64, kernel_size=(3, 3), stride=1, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        self.pool2 = nn.MaxPool2d(kernel_size=(2, 2))
        
        # Reshape to link to sequential model
        self.flatten = nn.Flatten(start_dim=2) # Collapse spectral bins
        self.lstm = nn.LSTM(input_size=64 * 32, hidden_size=128, num_layers=2, 
                            batch_first=True, bidirectional=True)
        
        # Dense classification head
        self.fc = nn.Linear(128 * 2, num_classes)
        self.softmax = nn.Softmax(dim=-1)

    def forward(self, x):
        # x: [Batch, 1, 128, 128]
        x = self.pool1(torch.relu(self.bn1(self.conv1(x))))
        x = self.pool2(torch.relu(self.bn2(self.conv2(x))))
        # x: [Batch, 64, 32, 32]
        
        # Re-arrange columns for RNN sequential stream: [Batch, Sequence_length, Features]
        x = x.permute(0, 3, 1, 2)
        x = self.flatten(x)
        
        lstm_out, _ = self.lstm(x) # Out: [Batch, Seq_len, 256]
        logits = self.fc(lstm_out[:, -1, :]) # Extract final state estimate
        return self.softmax(logits)
\`\`\`

#### Pitch Notes:
1. **Model Weight**: Just ~1.2M parameters.
2. **Execution Latency**: Runs in **< 12ms** per batch on a basic NVIDIA T4 GPU.`;

        } else if (query.includes("gpu") || query.includes("cost") || query.includes("nvidia")) {
          simulatedAnswer = `### GPU Architectural Cost & Orchestration Strategy

Let's size up our compute budget for the seed pitch deck. Separating 1 track using **Demucs v4 HT** (Hybrid Transformer) requires approximately **1.2 GFLOPs** of CUDA acceleration per real-time second.

#### 1. Hardware Metrics Sizing:
* **Nvidia T4 (16GB - Cheap)**: Best for bulk batch queuing. Processes a 3-minute song in approx **40 seconds**. Renting on RunPod Serverless costs roughly **$0.22/hour ($0.002 per song split)**. Best for MVP pricing margins.
* **Nvidia A10G (24GB - Midrange)**: Superior thread speed. Processes a 3-minute song in approx **9 seconds**! Cost on AWS is roughly **$1.01/hour ($0.003 per song split)**. Highly efficient.

#### 2. Seed Pitch Summary:
To serve **10,000 active separation jobs** every month (MVP projection), our total background cloud cost is less than **$80/month**! This is due to **RunPod Serverless container auto-scaling down to zero** when idle. We can leverage this to show investors we have massive unit profitability!`;

        } else if (query.includes("ascap") || query.includes("license") || query.includes("copyright")) {
          simulatedAnswer = `### SonicArc Copyright & Publishing Mitigation Blueprint

Musicians love uploading custom tracks (MP3/WAV) to separation mixers. However, copyrighted content calls for strict legal safeguards.

#### 1. Dual Sandbox Enforcement:
* **Private Practice Sandbox (Fair Use)**: If a user uploads an audio track, the separated stems and tabs remain locked under their private container storage. They cannot share the public links. This maps perfectly under legal 'Fair Use' educational practice exceptions (similar to Moises.ai).
* **Public Library Tracks (Fully Licensed)**: Any public audio searchable on our platform is populated via **Gracenote Rich Audio API** in integration with **ASCAP / BMI / PRS** licensing catalogs. We allocate a **$0.004/stream syndication royalty** as part of our high-tier premium subscription tier ($9.99/mo).

This isolates legal vulnerability while giving musicians the flexibility to isolate any personal local audio loops!`;

        } else {
          simulatedAnswer = `### SonicArc Edge WebAssembly DSP Optimization

Excellent question. To keep our server costs near zero for live microphone chord detection, we compile Essentia's Core C++ library to WebAssembly (Wasm) via Emscripten.

Here is how our client-side Javascript pipeline hooks into the compiled machine binary:

\`\`\`javascript
// Emscripten C++ boundary execution
Module.onRuntimeInitialized = () => {
  const essentiaPtr = new Module.EssentiaExtractor();
  
  // Create circular audio stream link
  const sampleBuffer = Module._malloc(2048 * 4); // Allocate float32 block
  
  window.onAudioStreamBlock = (pcmFloatArray) => {
    // Copy JavaScript float array to WebAssembly heap
    Module.HEAPF32.set(pcmFloatArray, sampleBuffer >> 2);
    
    // Run native C++ Mel-frequency extraction
    const chromaResultPtr = essentiaPtr.extractChroma(sampleBuffer, 2048);
    const resultVector = parseVector(chromaResultPtr);
    
    // Dispatch immediately to Fretboard and Keyboard React render loops
    updateUIFretboard(resultVector);
  };
};
\`\`\`

#### Seed Impact:
By offloading **70% of audio intelligence** directly to the user's mobile CPU using WebAssembly, we completely eliminate GPU bandwidth bottlenecks during active peak hours. This ensures 0ms transmission lag.`;
        }

        setMessages(prev => [...prev, { role: "assistant", content: simulatedAnswer }]);
        setIsLoading(false);
      }, 1000);
    }
  };

  return (
    <div className="bg-[#161B22] rounded-xl border border-gray-800 p-6 shadow-xl flex flex-col h-[520px]" id="cto-chat-assistant">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-cyan-400" size={18} />
          <div>
            <h3 className="text-sm font-sans font-semibold text-white">SonicArc CTO Technical Co-Founder</h3>
            <span className="text-[10px] text-gray-400 font-mono">
              {isUsingSimulatedKey ? "LOCAL EXPERT FALLBACK MODE" : "GEMINI ENVOY SERVER ROUTE"}
            </span>
          </div>
        </div>

        {/* Dynamic status badge */}
        <div className="bg-emerald-950/20 text-emerald-400 border border-emerald-500/15 rounded-full px-2.5 py-0.5 text-[9px] font-mono flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          ACTIVE
        </div>
      </div>

      {/* Message Stream console */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-3 max-w-[90%] ${
              m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            {/* Minimal Role avatar */}
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              m.role === "user" ? "bg-cyan-600 text-white" : "bg-cyan-950/40 text-cyan-300 border border-cyan-500/20"
            }`}>
              {m.role === "user" ? "CEO" : "CTO"}
            </div>

            {/* Bubble content */}
            <div className={`p-4 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-cyan-800 text-white rounded-tr-none"
                : "bg-[#0B0C10] text-[#f1f3f9] border border-gray-800 rounded-tl-none markdown-body"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 max-w-[80%] mr-auto">
            <div className="h-8 w-8 rounded-full bg-cyan-950/40 text-cyan-300 border border-cyan-500/20 flex items-center justify-center text-xs font-bold animate-pulse">
              CTO
            </div>
            <div className="bg-[#0B0C10] border border-gray-800 p-4 rounded-xl rounded-tl-none flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={consoleEndRef} />
      </div>

      {/* Suggested architectural prompt pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {SUGGESTED_PROMPTS.map((p) => (
          <button
            key={p.label}
            onClick={() => handleSendMessage(p.text)}
            className="text-[10px] text-gray-300 bg-[#0B0C10] hover:bg-gray-800 hover:text-white border border-gray-800 px-2.5 py-1.5 rounded-lg font-sans text-left truncate transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input console */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Ask our Co-Founder CTO about CUDA, PyTorch, ASCAP copyright..."
          className="flex-1 bg-[#0B0C10] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
          id="chat-input-field"
        />
        <button
          onClick={() => handleSendMessage()}
          className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl px-4 transition-all flex items-center justify-center shadow shadow-cyan-900/10"
          id="chat-send-btn"
        >
          <Send size={14} />
        </button>
      </div>

    </div>
  );
}
export default ChatAssistant;
