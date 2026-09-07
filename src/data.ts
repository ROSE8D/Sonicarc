import { SqlTable, TechCardData } from "./types";

export const PITCH_TABS = [
  { id: "overview", label: "Seed Pitch & Core Concept" },
  { id: "architecture", label: "System Design & Data Flow" },
  { id: "tech-stack", label: "Recommended Stack" },
  { id: "audio-pipeline", label: "AI & Audio Engineering" },
  { id: "latency", label: "Real-Time & Edge Processing" },
  { id: "database", label: "Data Architecture" },
  { id: "business", label: "Hurdles & Monetization" }
];

export const CORE_METRICS = [
  { label: "Target Seed Round", value: "$1.5M", desc: "For 18-month runaway" },
  { label: "Target Latency", value: "< 45ms", desc: "Real-time edge chord mapping" },
  { label: "Stems Separated", value: "< 12s", desc: "Per 3-min audio track (GPU)" },
  { label: "Client-Side Offload", value: "70%", desc: "Of total chord computation" }
];

export const SYSTEM_ARCHITECTURE_MERMAID = `
graph TD
    classDef client fill:#3b82f6,stroke:#1d4ed8,color:#fff;
    classDef api fill:#8b5cf6,stroke:#6d28d9,color:#fff;
    classDef worker fill:#10b981,stroke:#047857,color:#fff;
    classDef db fill:#f59e0b,stroke:#b45309,color:#fff;

    subgraph Client Tier [Client Device - Mobile/Web]
        A[Capture Mic Audio / Upload File]:::client
        B[WebAudio API / TFJS Chromagram]:::client
        C[Local Tab UI / Fretboard Renderer]:::client
    end

    subgraph Gateway [Ingress & Storage]
        D[API Gateway: Envoy / Gunicorn]:::api
        E[Storage Bucket: Cloud Storage / S3]:::api
        F[Redis Cluster: Task Queue & Live Locks]:::api
    end

    subgraph Processing Pipeline [AI GPU Workers]
        G[Celery Distributed Workers]:::worker
        H[Stem Isolation: Demucs v4 HT]:::worker
        I[DSP / BPM Analysis: Essentia]:::worker
        J[Deep Chord Classifier: ONNX Runtime]:::worker
    end

    subgraph Storage Tier [Databases]
        K[PostgreSQL: Songs & Profiles]:::db
        L[MongoDB: Timestamped Chord JSON]:::db
    end

    A -->|1. Live WebSockets Stream| B
    B -->|2. High-rate Local Estimate| C
    A -->|3. Audio File Upload| D
    D -->|4. Chunk Upload| E
    D -->|5. Queue Dispatch| F
    F -->|6. Fetch Job| G
    G -->|7. Split Stems| H
    G -->|8. Extract Pitch/Key| I
    G -->|9. Classify Chords| J
    H & I & J -->|10. Return Progressions| K
    J -->|11. Write JSON Document| L
    K & L -->|12. Audio Sync Tabs Stream| D
    D -->|13. Websocket Push synced Chords| C
`;

export const TECH_STACK_COMPARISON: TechCardData[] = [
  {
    title: "Client-Side Frontend",
    subtitle: "React Native vs Flutter for MusicTech",
    comparison: {
      optionA: "React Native (TS)",
      optionAPoints: [
        "Easier integration with Custom C++ Native Modules via JSI (Javascript Interface).",
        "Mature Web Audio API and Audio Context libraries available on NPM.",
        "Shared business logic with Web browser version (70% code reuse)."
      ],
      optionB: "Flutter (Dart)",
      optionBPoints: [
        "Consistent 60/120 FPS render loops for complex real-time fretboard animations.",
        "Dart FFI makes linking to native C++ Essentia libs highly performant.",
        "Excellent low-level audio thread access through fmod/oboe bindings."
      ],
      verdict: "React Native with JSI & TS is recommended to maximize code-sharing for our dual-target Web + Mobile roadmap and allow quick JSI C++ bridges."
    },
    recommendation: "React Native + TypeScript"
  },
  {
    title: "Server Core Backend",
    subtitle: "Python vs Rust/C++ for AI Ingress & API",
    comparison: {
      optionA: "Python (FastAPI + gRPC)",
      optionAPoints: [
        "Native ecosystem for PyTorch orchestration, NumPy processing, and Celery management.",
        "Faster MVP iterations, massive libraries (Librosa, Aubio, Madmom).",
        "Excellent bindings for standard GPU compute systems (CUDA)."
      ],
      optionB: "Rust (Actix-Web)",
      optionBPoints: [
        "Zero-cost abstractions with near-zero latency for stream multiplexing.",
        "Guaranteed thread safety for concurrent WebSocket audio connections.",
        "Memory-safe native DSP integrations without garbage collection pauses."
      ],
      verdict: "A Hybrid approach is optimal: FastAPI for user management & PyTorch AI scheduling, combined with a Rust microservice to handle WebSocket multiplexing for real-time streams."
    },
    recommendation: "FastAPI Core + Rust Streaming Proxy"
  },
  {
    title: "Cloud compute & GPU Scaling",
    subtitle: "Serverless GPUs vs Raw VM Orchestration",
    comparison: {
      optionA: "Serverless GPU (e.g. RunPod / Modal)",
      optionAPoints: [
        "Scales to actual usage; pay-per-second, avoiding idle GPU costs.",
        "Cold starts can be up to 10-15 seconds for massive PyTorch containers.",
        "Great for batch processing stem isolation on-demand during MVP."
      ],
      optionB: "Dedicated Spot GPU Pools (GCP/AWS)",
      optionBPoints: [
        "Always-hot instances with 0ms startup lag.",
        "Requires deep orchestration (K8s hpa, KEDA) to downscale during off-peak hours.",
        "Extremely expensive if idle, but superior latency for real-time WebSocket pipelines."
      ],
      verdict: "Use RunPod Serverless APIs for async Batch Stem Separation (high-tolerance to cold starts) & retain a small, dynamic pool of GCP spot instances running ONNX Runtime for active live streams."
    },
    recommendation: "RunPod Serverless (Async Stem Separation) + AWS/GCP Spot (Live)"
  }
];

export const AUDIO_PIPELINE_DETAILS = {
  stemSeparation: {
    title: "SOTA Stem Separation (Instrument Isolation)",
    comparison: "Demucs v4 (Hybrid Transformer) vs Spleeter (U-Net CNN)",
    analysis: [
      {
        model: "Deezer Spleeter (U-Net)",
        pros: "Lightning fast. Can separate a 3-minute song on standard CPU in less than 30 seconds. Perfect for immediate, cheap processing.",
        cons: "Suffer from severe phase-cancellation artifacts, spectral bleeding, and metallic flange. Unsuitable for musicians wanting high-quality practice tracks."
      },
      {
        model: "Meta Demucs v4 HT (Hybrid Transformer)",
        pros: "Studio-grade quality. Uses Hybrid Transformer Architecture combining time-domain and frequency-domain processing. Negligible leakage.",
        cons: "Highly compute-intensive. Requires CUDA GPU acceleration (e.g. NVIDIA T4 or A10G) to run near real-time."
      }
    ],
    verdict: "SonicArc will utilize Demucs v4 (4-stem model with Vocals, Drums, Bass, and Other) compiled to ONNX Runtime for deployment. We serve as premium Co-founder Architects; we cannot compromise on visual or audio artifacts for high-paying subscribers.",
    dspLibraries: [
      { name: "Essentia (C++)", purpose: "On-the-fly BPM onset detection, overall key Estimation using Tempogram profiles." },
      { name: "Librosa (Python)", purpose: "Feature extraction, Constant-Q Transform (CQT) for structural segmentation back-of-the-envelope calculations." },
      { name: "Aubio", purpose: "Fast pitch tracking and transient onset detection." }
    ]
  },
  chordDetection: {
    title: "Chord Detection & Neural Architecture",
    description: "Our pipeline separates chord recognition into two distinct contexts: Real-Time Edge (Zero server cost) and Deep Server Estimation.",
    edgePipeline: "1. Web Audio API extracts STFT (Short-Time Fourier Transform). 2. Group frequency bins into 12 semitones to generate chroma vectors. 3. Feed the vector sequence into a lightweight TensorFlow.js model trained on 15,000 chord patterns.",
    serverPipeline: "For premium, non-live tracks, we feed the full uncompressed isolated melodic stem into a deep convolutional neural network (CNN) combined with a Bi-directional LSTM. We extract deep audio embeddings (CREPE or VGGish) and decode chords with a Hidden Markov Model (HMM) to align structural boundaries perfectly."
  }
};

export const LATENCY_MITIGATION_BLUEPRINT = {
  challenges: [
    { title: "N-Buffer Delay", description: "Standard Web Audio API buffers can introduce 23-45ms of intrinsic latency depending on sample rate." },
    { title: "Network RTT", description: "Round-trip time on cellular (5G/LTE) networks can range from 40ms to 120ms, making real-time server chord-processing unfeasible for live play-along." },
    { title: "GC Pauses", description: "JavaScript garbage collector sweeps on React Native thread can cause jerky audio visual sync." }
  ],
  solutions: [
    {
      title: "Audio Worklet (Browser / Client)",
      description: "Do not run analysis on the main UI thread. We implement an ES6 Class extending AudioWorkletProcessor. It processes raw float32 samples directly on the high-priority audio render thread block-by-block (128 samples, <3ms delay) doing rapid FFT and downsampling before dispatching to the main thread."
    },
    {
      title: "WebAssembly (Wasm) Integration",
      description: "Compile Essentia's C++ DSP core into WebAssembly using Emscripten. This allows the client browser or mobile phone to compute high-fidelity Chroma Features and Tempo vectors directly at native machine speeds with zero server API cost."
    },
    {
      title: "Quantization & ONNX Runtime",
      description: "Quantize local chord classification models (INT8 quantization) to run inside ONNX Runtime Web. Reduces the neural model size from 45MB to just 4.2MB with <0.5% degradation in classification accuracy."
    }
  ],
  webAudioSampleCode: `// Highly optimized Client-Side Audio Worklet Processor
class ChordFeatureExtractor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(2048); // Hann window buffer
    this.bufferPointer = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input[0]) {
      const channelData = input[0];
      // Collect incoming samples (128 block size)
      for (let i = 0; i < channelData.length; i++) {
        this.buffer[this.bufferPointer++] = channelData[i];
        if (this.bufferPointer >= this.buffer.length) {
          // Window has filled up -> compute rapid DFT
          const chromaVector = this.computeChroma(this.buffer);
          this.port.postMessage({ type: 'CHROMA_VECTOR', chroma: chromaVector });
          
          // Apply 50% overlap step
          this.buffer.copyWithin(0, 1024, 2048);
          this.bufferPointer = 1024;
        }
      }
    }
    return true; // Keep processor alive
  }

  computeChroma(pcmData) {
    // 1. Apply Hanning Window to filter sidelobe leakage
    // 2. Map FFT bins to 12 semi-tone pitches (A440 base reference)
    // 3. Return normalized 12-dimensional array
    const chroma = new Float32Array(12);
    // [Optimized C++ ASM compiled under Emscripten performs fast mapping here]
    return chroma;
  }
}
registerProcessor('chord-processor', ChordFeatureExtractor);`
};

export const DATABASE_SCHEMA_BLUEPRINT: SqlTable[] = [
  {
    name: "songs",
    description: "Primary song registry carrying high-level musical meta-information. Master table with unique content hashing to prevent duplicate uploads.",
    columns: [
      { name: "id", type: "UUID", constraints: "PRIMARY KEY, DEFAULT gen_random_uuid()", description: "Unique catalog identifier" },
      { name: "title", type: "VARCHAR(255)", constraints: "NOT NULL", description: "Name of the musical track" },
      { name: "artist", type: "VARCHAR(150)", constraints: "NOT NULL, INDEXED", description: "Performing artist or composer" },
      { name: "bpm", type: "DECIMAL(5,2)", constraints: "CHECK (bpm > 0)", description: "Overall estimated tempo (beats per minute)" },
      { name: "musical_key", type: "VARCHAR(10)", constraints: "NOT NULL", description: "Estimated global key (e.g. 'Ab Minor', 'C# Major')" },
      { name: "audio_hash", type: "VARCHAR(64)", constraints: "UNIQUE, NOT NULL", description: "SHA-256 fingerprint of upload file to identify duplicates" },
      { name: "stems_status", type: "VARCHAR(20)", constraints: "NOT NULL", description: "'PENDING', 'PROCESSED', or 'FAILED'" },
      { name: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW()", description: "Date/time track was indexed" }
    ],
    sampleQuery: `SELECT title, artist, bpm, musical_key 
FROM songs 
WHERE musical_key = 'G Major' AND bpm BETWEEN 110 AND 125 
ORDER BY created_at DESC 
LIMIT 5;`,
    sampleResult: `[
  { "title": "Starlight Muse", "artist": "The Resonance", "bpm": 120.50, "musical_key": "G Major" },
  { "title": "Acoustic Horizon", "artist": "Claire de Lune", "bpm": 114.00, "musical_key": "G Major" }
]`
  },
  {
    name: "chord_progressions (NoSQL / Time-Series JSON Structure)",
    description: "Highly optimized time-stamped structures. Recommending a flexible JSON document style (PostgreSQL JsonB or MongoDB document) representing Millisecond Offset -> Chord Name.",
    columns: [
      { name: "song_id", type: "UUID", constraints: "FOREIGN KEY REFERENCES songs(id)", description: "Associated song" },
      { name: "chord_index", type: "INTEGER", constraints: "NOT NULL", description: "Sequential index order of the chord shift" },
      { name: "timestamp_ms", type: "INTEGER", constraints: "NOT NULL, INDEXED_ASC", description: "Exact milli-second in the audio file where chord initiates" },
      { name: "chord_name", type: "VARCHAR(15)", constraints: "NOT NULL", description: "The music theory shorthand chord label (e.g. 'Cmaj7', 'Asus4')" },
      { name: "confidence", type: "DECIMAL(3,2)", constraints: "range 0.00 to 1.00", description: "Model certainty estimate for confidence bounds metrics" }
    ],
    sampleQuery: `SELECT timestamp_ms, chord_name, confidence 
FROM chord_progressions 
WHERE song_id = 'c1274a12-da34-453b-857e-7a912bbfa321' 
ORDER BY timestamp_ms ASC;`,
    sampleResult: `[
  { "timestamp_ms": 0, "chord_name": "Emin", "confidence": 0.98 },
  { "timestamp_ms": 1820, "chord_name": "Cmaj", "confidence": 0.94 },
  { "timestamp_ms": 3610, "chord_name": "Gmaj", "confidence": 0.91 },
  { "timestamp_ms": 5400, "chord_name": "Dmaj", "confidence": 0.89 }
]`
  },
  {
    name: "isolated_stems_metadata",
    description: "Pointers to distributed CDN routes (Amazon CloudFront / Cloudflare R2) storing isolated audio stems processed from Demucs v4 HT.",
    columns: [
      { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Primary reference" },
      { name: "song_id", type: "UUID", constraints: "REFERENCES songs(id) ON DELETE CASCADE", description: "Associated original song" },
      { name: "vocals_url", type: "VARCHAR(512)", constraints: "NOT NULL", description: "Path to isolated vocal stem AAC file" },
      { name: "drums_url", type: "VARCHAR(512)", constraints: "NOT NULL", description: "Path to isolated drums stem AAC file" },
      { name: "bass_url", type: "VARCHAR(512)", constraints: "NOT NULL", description: "Path to isolated bass stem AAC file" },
      { name: "other_url", type: "VARCHAR(512)", constraints: "NOT NULL", description: "Path to isolated melodic synth/guitar stem AAC file" }
    ],
    sampleQuery: `SELECT vocals_url, bass_url 
FROM isolated_stems_metadata 
WHERE song_id = 'c1274a12-da34-453b-857e-7a912bbfa321';`,
    sampleResult: `[
  {
    "vocals_url": "https://cdn.sonicarc.com/stems/c1274_vocals.bin",
    "bass_url": "https://cdn.sonicarc.com/stems/c1274_bass.bin"
  }
]`
  }
];

export const SHAZAM_CHORDS_METRIC = "We estimate that storing 1 million song chord tracks with 100 chord alterations per song takes less than 8GB of database memory index, enabling lightning-fast Redis caching!";
