export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChordSegment {
  chord: string;
  start: number;
  end: number;
  confidence: number;
}

export interface ChordAnalysis {
  key: string;
  key_confidence?: number;
  bpm: number | null;
  bpm_confidence?: number | null;
  duration: number;
  chords: ChordSegment[];
  method?: string;
}

export interface ChordAnalysisResponse {
  analysis: ChordAnalysis;
  filename: string;
  mime_type?: string;
}

export type AdaptationInstrument = "guitar" | "piano";
export type AdaptationSkill = "beginner" | "intermediate" | "advanced";

export interface ChordAdaptationResponse {
  adaptedChords: Array<{ original: string; adapted: string; reason: string }>;
  transposeTo: string | null;
  capo: number | null;
  summary: string;
}

export interface SqlTable {
  name: string;
  description: string;
  columns: {
    name: string;
    type: string;
    constraints?: string;
    description: string;
  }[];
  sampleQuery: string;
  sampleResult: string;
}

export interface TechCardData {
  title: string;
  subtitle: string;
  comparison: {
    optionA: string;
    optionAPoints: string[];
    optionB: string;
    optionBPoints: string[];
    verdict: string;
  };
  recommendation: string;
}
