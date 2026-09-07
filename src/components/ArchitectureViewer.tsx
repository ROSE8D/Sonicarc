import React, { useState } from "react";
import {
  Server,
  Code,
  Layers,
  Database,
  ArrowRight,
  ClipboardCheck,
  Copy,
  User,
  Cpu,
  Monitor,
  Video,
  FileAudio,
  HardDrive,
  Network,
  Activity,
  Play,
  CheckCircle,
  HelpCircle
} from "lucide-react";

export function ArchitectureViewer() {
  const [activeTab, setActiveTab] = useState<"system" | "sequence" | "mermaid">("system");
  const [selectedSystemNode, setSelectedSystemNode] = useState<string>("frontend");
  const [selectedSequenceStep, setSelectedSequenceStep] = useState<number>(0);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopyClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const MERMAID_SYSTEM_DIAGRAM = `graph TD
    User([User / Musician]) <-->|Acoustic Sound / Audio Upload| ClientApp[Web Browser / SonicArc App]
    
    subgraph Frontend [Client Web Application - React & Vite]
        ClientApp -->|Record audio| MicController[Microphone Input & MediaRecorder]
        ClientApp -->|Select files| FileUploader[Drag & Drop / File Upload Zone]
        MicController -->|Raw PCM Float32 / WAV| WaveformVisualizer[Waveform Spectral Analyzer]
        FileUploader -->|WAV / MP3 / AAC| WaveformVisualizer
        WaveformVisualizer -->|API Client Payload| SecureRequestManager[Secure API Request Orchestrator]
    end

    subgraph Backend [Full-Stack API Server - Express & Node.js]
        SecureRequestManager <-->|JSON POST /api/analyze-instrument| ExpressServer[Express API Route Router]
        ExpressServer -->|Temp file pipeline| AudioPreprocessor[Audio Preprocessor Node]
        AudioPreprocessor -->|FFT / Mel Spectrogram Extraction| AudioPreprocessor
    end

    subgraph ML_AI [Instrument Classifier Inference Engine]
        AudioPreprocessor -->|Extracted Spectrogram Vectors| AIClassifier[Google Gemini Pro 1.5 Audio / Custom CNN]
        AIClassifier -->|Softmax Probabilities & Prediction Labels| ExpressServer
    end

    subgraph DataStore [Storage & Database Repository]
        ExpressServer <-->|Store Analysis Metrics / Save History| RelationalDB[(PostgreSQL Database)]
        ExpressServer <-->|Upload Audio Binaries / Stems| CloudStorage[(Google Cloud Audio Storage)]
    end

    ExpressServer -->|Returns Prediction & Confidence Metrics & History| SecureRequestManager
    SecureRequestManager -->|Reactive Hook Dispatch| ResultDisplay[High-Contrast Instrument Card UI]
    ResultDisplay -->|Displays Instrument, Details, Confidence Ratio| User`;

  const MERMAID_SEQUENCE_DIAGRAM = `sequenceDiagram
    autonumber
    actor User as Musician
    participant Frontend as Web Client (React UI)
    participant Backend as API Server (Express)
    participant Pipeline as Audio Preprocessor
    participant Model as Gemini Audio Classifier
    participant DB as Schema Repository (PostgreSQL)

    User->>Frontend: Clicks "Record Sample"
    Frontend->>User: Request Microphone Access Permission
    User->>Frontend: Grant Permission & Start Audio Stream
    Note over Frontend: Active recording: capture PCM float32 buffers...
    User->>Frontend: Clicks "Stop" (Short Sample captured)
    Frontend->>Backend: Post Multipart Form Data (/api/analyze-instrument)
    
    rect rgb(15, 17, 26)
        Note over Backend, Pipeline: Service processing pipeline active
        Backend->>Pipeline: Extract raw Audio Stream
        Pipeline->>Pipeline: Compute Short-Time Fourier Transform (STFT)
        Pipeline->>Pipeline: Transform raw PCM elements to Mel Spectrogram
    end
    
    Backend->>Model: Dispatch acoustic vectors / raw WAV payload
    activate Model
    Note over Model: Deep Learning model extracts pitch, timbre & spectral characteristics
    Model-->>Backend: Returns predictions (e.g. Piano: 94%, Violin: 4%, Flute: 2%)
    deactivate Model
    
    opt History Tracking
        Backend->>DB: Log analysis session result & insert history record
        DB-->>Backend: Acknowledge execution transaction
    end
    
    Backend-->>Frontend: Return Predicted Instrument, Accuracy Confidence & metadata JSON
    Frontend->>Frontend: Stop visual loading animations & trigger vector charts
    Frontend-->>User: Display Dynamic Instrument card (Piano - 94% Confidence)`;

  // SYSTEM NODES SPECS
  const SYSTEM_NODES_DATA: Record<string, {
    title: string;
    icon: any;
    role: string;
    specs: string[];
    sampleCode: string;
    techStack: string;
  }> = {
    user: {
      title: "Musician / End User",
      icon: User,
      role: "Initiates the pipeline by speaking, playing an audio source (guitar, keys, synth), or uploading pre-recorded wav/mp3 file samples directly via browser handles.",
      specs: [
        "Primary action: Record Live (PCM Stream) or File Drag & Drop",
        "Required feedback latency: <120ms for instant visual feedback",
        "Supports common formats: .wav, .mp3, .aac, .m4a, .flac"
      ],
      techStack: "Chrome AudioNode Core / Web Audio API",
      sampleCode: `// Trigger recording session state
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    mediaRecorder.start();
  });`
    },
    frontend: {
      title: "React Web Application",
      icon: Monitor,
      role: "Provides high-contrast sleek Bento dashboards. Handles microphone input, visualizes simulated waveform vectors, packs blobs into Form Data payloads, and dispatches server-side requests securely.",
      specs: [
        "Frame: React 19 + Tailwind CSS + Lucide Icons",
        "Dynamic Spectrogram layout rendering",
        "State machine orchestrates transition locks from 'upload' to 'predict'"
      ],
      techStack: "React 19 / TypeScript / Tailwind CSS / Lucide",
      sampleCode: `// Dispatch file payload to backend router
const payload = new FormData();
payload.append("file", audioBlob, "sample.wav");

const response = await fetch("/api/analyze-instrument", {
  method: "POST",
  body: payload
});
const result = await response.json();`
    },
    backend: {
      title: "Express API Controller",
      icon: Server,
      role: "Manages robust authentication gateways, exposes secure ingestion endpoints, and initiates the Short-Time Fourier Transform (STFT) pipeline for raw audio payloads.",
      specs: [
        "Endpoints mapping: POST /api/analyze-instrument",
        "File preprocessing buffer parsing with multer engine",
        "Initiates parallel tasks: DB save & ML Classifier forwarding"
      ],
      techStack: "Express Node.js / TypeScript / Tsx runner",
      sampleCode: `// Express service orchestration endpoint
app.post("/api/analyze-instrument", upload.single("file"), async (req, res) => {
  const fileBuffer = req.file.buffer;
  const features = await preprocessAudioBuffer(fileBuffer);
  const prediction = await queryInstrumentModel(features);
  
  await logQueryHistory(req.user.id, prediction);
  res.json({ success: true, prediction });
});`
    },
    preprocessor: {
      title: "Audio Preprocessor Node",
      icon: Activity,
      role: "Performs feature extraction on incoming audio buffers. Normalizes decibel amplitude thresholds, samples PCM vectors, and computes Hann window FFT to derive Mel-Scaled Spectrogram logs.",
      specs: [
        "Sample rate: Downsampled to 16,000 Hz mono",
        "Spectrogram grid frame: 25ms Window, 10ms Hop step",
        "Mel scale bins: 128 coefficients mapped to vector strings"
      ],
      techStack: "WAV Decoder / Mel-Scale transform algorithm",
      sampleCode: `function transformMelSpectrogram(pcmData: Float32Array) {
  const stftMatrix = computeSTFT(pcmData, { winLen: 400, hopLen: 160 });
  const melScaleCoeffs = applyMelFilterbanks(stftMatrix);
  return normalizeMatrix(melScaleCoeffs);
}`
    },
    ai_model: {
      title: "AI Model Instrument Classifier",
      icon: Cpu,
      role: "Evaluates the pre-computed Mel Spectrogram acoustic vectors using a specialized audio classification model to score instrument classification probabilities.",
      specs: [
        "Model: Gemini 2.5 Flash Audio classifier / Quantized CNN Web model",
        "Output layer: Softmax logits outputting probabilities over 32 instrument classes",
        "Confidence precision: Returns high-confidence (0.0 to 1.0) scores + metadata description"
      ],
      techStack: "@google/genai SDK / Multimodal Audio inference",
      sampleCode: `// Multimodal inference using Google GenAI SDK
import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [
    { inlineData: { mimeType: 'audio/wav', data: base64Audio } },
    "Analyze this audio stream and return the playing musical instrument, confidence, and frequency peaks."
  ]
});`
    },
    database: {
      title: "PostgreSQL Schema State",
      icon: Database,
      role: "Stores user query logs, saves history parameters for predictive audits, and holds the categorical metadata repository about detected instrument profiles.",
      specs: [
        "Tables: 'analysis_history', 'instrument_catalog', 'user_credentials'",
        "Maintains structural index constraints for high-throughput searching",
        "Integrated via drizzle ORM and Cloud SQL relational nodes"
      ],
      techStack: "Cloud SQL / PostgreSQL 15 / Drizzle ORM",
      sampleCode: `// PostgreSQL Query history migration logging
CREATE TABLE analysis_history (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  instrument_name VARCHAR(100) NOT NULL,
  confidence_score NUMERIC(5, 2) NOT NULL,
  sample_url VARCHAR(512),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
    }
  };

  // SEQUENCE STEPS DATA (Interactive)
  const SEQUENCE_STEPS_LIST = [
    {
      num: 1,
      title: "Trigger Recording Session",
      sender: "User",
      receiver: "Frontend UI",
      desc: "User interacts with the sleek Bento interface and clicks 'Record' matching the SonicArc Shazam-style layout.",
      actionText: "Tap mic recorder button node"
    },
    {
      num: 2,
      title: "Microphone Access Request",
      sender: "Frontend UI",
      receiver: "User Browser",
      desc: "The client application queries the browser navigator object asking for active hardware microphone access permissions.",
      actionText: "getUserMedia() browser request"
    },
    {
      num: 3,
      title: "Raw PCM Sound Ingestion",
      sender: "User Browser",
      receiver: "Frontend State",
      desc: "User plays their chord or instrument. The client records the audio blocks as standard MediaRecorder stream packets.",
      actionText: "Float32 bytes feed to raw blob chunk"
    },
    {
      num: 4,
      title: "Form Payload Transmission",
      sender: "Frontend UI",
      receiver: "Express Server",
      desc: "The frontend packages are bundled into a multipart binary stream request and dispatched safely to the POST router.",
      actionText: "Multipart POST /api/analyze-instrument"
    },
    {
      num: 5,
      title: "Acoustic Preprocessing",
      sender: "Express Server",
      receiver: "Preprocessor Node",
      desc: "The server isolates the audio buffer stream, downsamples to 16kHz, and applies STFT to output a 128 Mel-scale matrices array.",
      actionText: "Hann-Window Fast Fourier Transform"
    },
    {
      num: 6,
      title: "Model Feature Evaluation",
      sender: "Express Server",
      receiver: "Gemini / ML Engine",
      desc: "The processed audio vectors are forwarded directly to the Google Gemini AI audio model or specialized instrument neural classifier.",
      actionText: "Forwarding multimodal base64 payload"
    },
    {
      num: 7,
      title: "Probability Inference",
      sender: "Gemini / ML Engine",
      receiver: "Express Server",
      desc: "Deep learning layers process Pitch and Timbre models, Returning classification probability distributions and metadata tags.",
      actionText: "Softmax Classification (e.g. Acoustic Guitar: 96%)"
    },
    {
      num: 8,
      title: "Result History Logging",
      sender: "Express Server",
      receiver: "PostgreSQL",
      desc: "The API logs the query session, predicted instrument label, user profile parameters and confidence scores in the query repository.",
      actionText: "SQL insert into analysis_history table"
    },
    {
      num: 9,
      title: "Dynamic Dashboard Display",
      sender: "Express Server",
      receiver: "Frontend UI",
      desc: "The backend returns the JSON result. Frontend triggers a dynamic, glowing instrument card, displaying detailed logs and statistics.",
      actionText: "State changes to SUCCESS, displaying instrument results"
    }
  ];

  const currentStepInfo = SEQUENCE_STEPS_LIST[selectedSequenceStep];

  return (
    <div className="bg-[#161B22] rounded-xl border border-gray-800 p-6 shadow-xl" id="architecture-blueprint-viewer">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Network className="text-cyan-400" size={20} />
            <h3 className="text-lg font-sans font-medium text-white">SonicArc Architecture Blueprints</h3>
          </div>
          <p className="text-xs text-gray-400 max-w-xl">
            Explore the structural engineering guidelines driving the SonicArc sound-signature analysis. Toggle interactive block modes or copy compliant Mermaid codes.
          </p>
        </div>

        {/* Action controllers */}
        <div className="flex gap-1.5 bg-[#0B0C10] p-1 rounded-lg border border-gray-800">
          <button
            onClick={() => setActiveTab("system")}
            className={`px-3 py-1.5 rounded-md text-xs font-sans font-semibold transition-all ${
              activeTab === "system"
                ? "bg-cyan-500 text-black shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            System Diagram
          </button>
          <button
            onClick={() => setActiveTab("sequence")}
            className={`px-3 py-1.5 rounded-md text-xs font-sans font-semibold transition-all ${
              activeTab === "sequence"
                ? "bg-cyan-500 text-black shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Sequence Diagram
          </button>
          <button
            onClick={() => setActiveTab("mermaid")}
            className={`px-3 py-1.5 rounded-md text-xs font-sans font-semibold transition-all ${
              activeTab === "mermaid"
                ? "bg-cyan-500 text-black shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Mermaid Raw Code
          </button>
        </div>
      </div>

      {/* --- TAB 1: INTERACTIVE SYSTEM ARCHITECTURE MAP --- */}
      {activeTab === "system" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          
          {/* Interactive SVG Diagram Canvas (L: 7 cols) */}
          <div className="lg:col-span-7 bg-[#0B0C10] rounded-xl border border-gray-800 p-5 flex flex-col justify-between min-h-[460px]">
            <div>
              <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider font-extrabold">
                  Interactive Node Topography (Click any box)
                </span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/30">
                  LIVE INTERPRETATION
                </span>
              </div>

              {/* Visually stunning horizontal connection flow charts in pure html style matching bento design */}
              <div className="space-y-6 py-4">
                
                {/* LEVEL 1: INGESTION STAGE */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setSelectedSystemNode("user")}
                    className={`p-3.5 rounded-xl border text-center transition-all w-36 ${
                      selectedSystemNode === "user"
                        ? "bg-cyan-950/20 border-cyan-500 shadow-[0_0_12px_rgba(0,240,255,0.15)] ring-1 ring-cyan-400/30"
                        : "bg-gray-900/40 border-gray-800 hover:border-gray-700 hover:bg-gray-800/40"
                    }`}
                  >
                    <User className={`mx-auto mb-1.5 ${selectedSystemNode === "user" ? "text-cyan-400 animate-pulse" : "text-gray-400"}`} size={18} />
                    <span className="text-xxs font-mono font-bold block text-white uppercase">1. Musician / User</span>
                    <span className="text-[9px] font-sans text-gray-500 block mt-1">Audio Source</span>
                  </button>

                  <div className="flex items-center text-gray-700">
                    <span className="w-6 h-0.5 bg-cyan-800 relative block">
                      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedSystemNode("frontend")}
                    className={`p-3.5 rounded-xl border text-center transition-all w-40 ${
                      selectedSystemNode === "frontend"
                        ? "bg-cyan-950/20 border-cyan-505 shadow-[0_0_12px_rgba(0,240,255,0.15)] ring-1 ring-cyan-400/30"
                        : "bg-gray-900/40 border-gray-800 hover:border-gray-700 hover:bg-gray-800/40"
                    }`}
                  >
                    <Monitor className={`mx-auto mb-1.5 ${selectedSystemNode === "frontend" ? "text-cyan-400 animate-pulse" : "text-gray-400"}`} size={18} />
                    <span className="text-xxs font-mono font-bold block text-white uppercase">2. React Ingestion</span>
                    <span className="text-[9px] font-sans text-gray-500 block mt-1">Bento Portal UI</span>
                  </button>
                </div>

                {/* Vertical arrow link down */}
                <div className="flex justify-center">
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-6 bg-gradient-to-b from-cyan-800 to-[#4361ee] relative" />
                    <ArrowRight size={12} className="text-[#4361ee] rotate-90 -mt-1.5" />
                  </div>
                </div>

                {/* LEVEL 2: EDGE PROCESSOR & API ROUTING */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setSelectedSystemNode("backend")}
                    className={`p-3.5 rounded-xl border text-center transition-all w-48 ${
                      selectedSystemNode === "backend"
                        ? "bg-cyan-950/20 border-cyan-500 shadow-[0_0_12px_rgba(0,240,255,0.15)] ring-1 ring-cyan-400/30"
                        : "bg-gray-900/40 border-gray-800 hover:border-gray-700 hover:bg-gray-800/40"
                    }`}
                  >
                    <Server className={`mx-auto mb-1.5 ${selectedSystemNode === "backend" ? "text-cyan-400 animate-pulse" : "text-gray-400"}`} size={18} />
                    <span className="text-xxs font-mono font-bold block text-white uppercase">3. Node.js API Broker</span>
                    <span className="text-[9px] font-sans text-gray-500 block mt-1">Express Orchestrator</span>
                  </button>

                  <div className="flex items-center text-gray-700">
                    <span className="w-6 h-0.5 bg-purple-800 relative block">
                      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-purple-400 animate-ping" />
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedSystemNode("preprocessor")}
                    className={`p-3.5 rounded-xl border text-center transition-all w-44 ${
                      selectedSystemNode === "preprocessor"
                        ? "bg-cyan-950/20 border-cyan-500 shadow-[0_0_12px_rgba(0,240,255,0.15)] ring-1 ring-cyan-400/30"
                        : "bg-gray-900/40 border-gray-800 hover:border-gray-700 hover:bg-gray-800/40"
                    }`}
                  >
                    <Activity className={`mx-auto mb-1.5 ${selectedSystemNode === "preprocessor" ? "text-cyan-400 animate-pulse" : "text-gray-400"}`} size={18} />
                    <span className="text-xxs font-mono font-bold block text-white uppercase">4. Preprocessor</span>
                    <span className="text-[9px] font-sans text-gray-500 block mt-1">Spectrogram FFT Engine</span>
                  </button>
                </div>

                {/* Vertical arrow link down */}
                <div className="flex justify-center">
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-6 bg-gradient-to-b from-[#4361ee] to-purple-800 relative" />
                    <ArrowRight size={12} className="text-purple-800 rotate-90 -mt-1.5" />
                  </div>
                </div>

                {/* LEVEL 3: ML CLASSIFICATION & STATE DATASTORE */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setSelectedSystemNode("ai_model")}
                    className={`p-3.5 rounded-xl border text-center transition-all w-52 ${
                      selectedSystemNode === "ai_model"
                        ? "bg-cyan-950/20 border-cyan-500 shadow-[0_0_12px_rgba(0,240,255,0.15)] ring-1 ring-cyan-400/30"
                        : "bg-gray-900/40 border-gray-800 hover:border-gray-700 hover:bg-gray-800/40"
                    }`}
                  >
                    <Cpu className={`mx-auto mb-1.5 ${selectedSystemNode === "ai_model" ? "text-cyan-400 animate-pulse" : "text-gray-400"}`} size={18} />
                    <span className="text-xxs font-mono font-bold block text-white uppercase">5. Gemini AI Classifier</span>
                    <span className="text-[9px] font-sans text-gray-500 block mt-1">Deep Signal Inference</span>
                  </button>

                  <div className="flex items-center text-gray-700">
                    <span className="w-6 h-0.5 bg-emerald-800 relative block">
                      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedSystemNode("database")}
                    className={`p-3.5 rounded-xl border text-center transition-all w-48 ${
                      selectedSystemNode === "database"
                        ? "bg-cyan-950/20 border-cyan-500 shadow-[0_0_12px_rgba(0,240,255,0.15)] ring-1 ring-cyan-400/30"
                        : "bg-gray-900/40 border-gray-800 hover:border-gray-700 hover:bg-gray-800/40"
                    }`}
                  >
                    <Database className={`mx-auto mb-1.5 ${selectedSystemNode === "database" ? "text-cyan-400 animate-pulse" : "text-gray-400"}`} size={18} />
                    <span className="text-xxs font-mono font-bold block text-white uppercase">6. Postgres Relational DB</span>
                    <span className="text-[9px] font-sans text-gray-500 block mt-1">Drizzle Schema Logs</span>
                  </button>
                </div>

              </div>
            </div>

            {/* Disclaimer metadata details */}
            <span className="text-[9.5px] font-mono text-gray-500 block mt-3">
              *Designed for unified cloud-run low-latency audio packet processing.
            </span>
          </div>

          {/* Interactive Specification View Panel (R: 5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-5 animate-in fade-in duration-300">
            <div className="bg-[#0B0C10] border border-gray-800 rounded-xl p-5 flex-1 flex flex-col justify-between">
              <div>
                {/* Node details */}
                <div className="flex items-center gap-2.5 border-b border-gray-850 pb-3 mb-4">
                  {React.createElement(SYSTEM_NODES_DATA[selectedSystemNode].icon, {
                    className: "text-cyan-400",
                    size: 16
                  })}
                  <h4 className="text-xs font-mono font-bold text-white capitalize">
                    {SYSTEM_NODES_DATA[selectedSystemNode].title} Specification
                  </h4>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed font-sans mb-4">
                  {SYSTEM_NODES_DATA[selectedSystemNode].role}
                </p>

                <div className="space-y-2 mb-4">
                  <span className="text-[10px] font-mono text-gray-500 block uppercase font-bold">Key Architectural Specs:</span>
                  {SYSTEM_NODES_DATA[selectedSystemNode].specs.map((spec, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] text-gray-400 leading-normal font-sans">
                      <span className="text-cyan-500 font-bold shrink-0">•</span>
                      <span>{spec}</span>
                    </div>
                  ))}
                </div>

                {/* Technical Stack Indicator */}
                <div className="flex items-center gap-1.5 bg-gray-950 p-2 rounded-lg border border-gray-850 text-[10px] font-mono text-gray-300 mb-4">
                  <span className="text-gray-500">ENGINEERING STACK:</span>
                  <span className="text-cyan-400 font-bold">{SYSTEM_NODES_DATA[selectedSystemNode].techStack}</span>
                </div>
              </div>

              {/* Sample pipeline code block */}
              <div>
                <span className="text-[10px] font-mono text-gray-500 block uppercase mb-1.5 font-bold">Inference Production Sample:</span>
                <pre className="bg-[#050608] border border-gray-850 font-mono text-[9px] text-[#00ff7f] leading-relaxed p-3.5 rounded-lg select-all overflow-x-auto">
                  {SYSTEM_NODES_DATA[selectedSystemNode].sampleCode}
                </pre>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* --- TAB 2: INTERACTIVE STEP-BY-STEP SEQUENCE MODEL --- */}
      {activeTab === "sequence" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          
          {/* Vertical step list (L: 5 cols) */}
          <div className="lg:col-span-5 bg-[#0B0C10] rounded-xl border border-gray-800 p-5 max-h-[500px] overflow-y-auto space-y-2">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest pl-1 block mb-2 font-bold">
              Predictive Sequence Timeline Steps
            </span>

            {SEQUENCE_STEPS_LIST.map((step, idx) => (
              <button
                key={step.num}
                onClick={() => setSelectedSequenceStep(idx)}
                className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors ${
                  selectedSequenceStep === idx
                    ? "bg-cyan-950/20 border-cyan-500/40 text-white"
                    : "bg-[#07080A] border-gray-850 text-gray-400 hover:bg-gray-800/40"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={`h-5 w-5 rounded-full font-mono text-[10px] font-bold flex items-center justify-center shrink-0 ${
                    selectedSequenceStep === idx ? "bg-cyan-400 text-[#07080A]" : "bg-gray-800 text-gray-400"
                  }`}>
                    {step.num}
                  </span>
                  <span className="text-xs font-sans font-bold block truncate leading-none">
                    {step.title}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 text-gray-500 text-right shrink-0">
                    {step.sender}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Deep step transaction details (R: 7 cols) */}
          <div className="lg:col-span-7 bg-[#0B0C10] border border-gray-800 rounded-xl p-5 flex flex-col justify-between shadow-lg">
            
            <div>
              {/* Step title */}
              <div className="flex items-center justify-between border-b border-gray-850 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="bg-cyan-900/30 border border-cyan-500/20 rounded-md h-6 w-12 flex items-center justify-center font-mono text-xxs text-cyan-400 font-extrabold">
                    STEP {currentStepInfo.num} / 9
                  </span>
                  <h4 className="text-sm font-sans font-black text-white">
                    {currentStepInfo.title}
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-gray-500">STFT CONTEXT MAPPING</span>
              </div>

              {/* Sender & Receiver metadata card */}
              <div className="grid grid-cols-2 gap-3.5 mb-5">
                <div className="bg-[#050608] p-3 rounded-lg border border-gray-850">
                  <span className="text-[9px] font-mono text-gray-500 uppercase font-bold leading-none block">TRANSMITTING SENDER:</span>
                  <span className="text-xs font-mono text-cyan-300 font-bold block mt-1">{currentStepInfo.sender}</span>
                </div>
                <div className="bg-[#050608] p-3 rounded-lg border border-gray-850">
                  <span className="text-[9px] font-mono text-gray-500 uppercase font-bold leading-none block">DESTID RECEIVER:</span>
                  <span className="text-xs font-mono text-indigo-300 font-bold block mt-1">{currentStepInfo.receiver}</span>
                </div>
              </div>

              {/* Step narrative */}
              <div className="space-y-4 mb-4">
                <div className="bg-[#050608]/40 p-4 rounded-xl border border-gray-850 leading-relaxed text-xs text-gray-300 font-sans">
                  {currentStepInfo.desc}
                </div>

                <div className="flex items-start gap-2 bg-cyan-950/15 border border-cyan-500/15 rounded-lg p-3 text-xs text-cyan-400 font-sans">
                  <CheckCircle size={14} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold block">Internal Transaction Action:</span>
                    <span className="block mt-0.5 leading-normal">{currentStepInfo.actionText}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive workflow progress bar controls */}
            <div className="flex items-center justify-between border-t border-gray-850 pt-4">
              <span className="text-[10px] font-mono text-gray-500 uppercase font-bold">STATE RE-FLOW ENGINE</span>
              
              <div className="flex gap-2">
                <button
                  disabled={selectedSequenceStep === 0}
                  onClick={() => setSelectedSequenceStep(p => p - 1)}
                  className="bg-gray-900 border border-gray-800 text-xs px-3 py-1 rounded font-medium text-gray-300 hover:text-white disabled:opacity-40 select-none"
                >
                  Prev Step
                </button>
                <button
                  disabled={selectedSequenceStep === SEQUENCE_STEPS_LIST.length - 1}
                  onClick={() => setSelectedSequenceStep(p => p + 1)}
                  className="bg-cyan-500 text-black text-xs px-3 py-1 rounded font-bold hover:scale-[1.02] active:scale-95 disabled:opacity-40 transition-all select-none"
                >
                  Next Step
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* --- TAB 3: MERMAID CODE COPIER TAB --- */}
      {activeTab === "mermaid" && (
        <div className="space-y-6 animate-in fade-in duration-300" id="mermaid-raw-syntax-tab">
          
          {/* Section 1: System Diagram */}
          <div className="bg-[#0B0C10] border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between border-b border-gray-850 pb-3 mb-4">
              <h4 className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                <Layers size={14} className="text-cyan-400" />
                1. System Diagram (Mermaid Syntax Node)
              </h4>
              <button
                onClick={() => handleCopyClipboard(MERMAID_SYSTEM_DIAGRAM, "system")}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#161B22] border border-gray-800 hover:bg-gray-800 hover:text-white transition-all text-[11px] text-gray-405 font-mono"
              >
                {copiedText === "system" ? <ClipboardCheck size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedText === "system" ? "Copied!" : "Copy Code"}</span>
              </button>
            </div>

            <pre className="bg-[#050608] border border-gray-850 rounded-lg p-4 font-mono text-[10px] text-gray-300 select-all overflow-y-auto max-h-[300px] leading-relaxed">
              {MERMAID_SYSTEM_DIAGRAM}
            </pre>
          </div>

          {/* Section 2: Sequence Diagram */}
          <div className="bg-[#0B0C10] border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between border-b border-gray-850 pb-3 mb-4">
              <h4 className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                <Activity size={14} className="text-cyan-400" />
                2. Sequence Diagram (User Recording Inference Flow)
              </h4>
              <button
                onClick={() => handleCopyClipboard(MERMAID_SEQUENCE_DIAGRAM, "sequence")}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#161B22] border border-gray-800 hover:bg-gray-800 hover:text-white transition-all text-[11px] text-gray-405 font-mono"
              >
                {copiedText === "sequence" ? <ClipboardCheck size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedText === "sequence" ? "Copied!" : "Copy Code"}</span>
              </button>
            </div>

            <pre className="bg-[#050608] border border-gray-850 rounded-lg p-4 font-mono text-[10px] text-gray-300 select-all overflow-y-auto max-h-[300px] leading-relaxed">
              {MERMAID_SEQUENCE_DIAGRAM}
            </pre>
          </div>

        </div>
      )}

    </div>
  );
}
