import { useCallback, useState } from "react";
import { analyzeChordAudio } from "../api/chordAnalysis";
import type { ChordAnalysisResponse } from "../types";

export function useChordAnalysis() {
  const [result, setResult] = useState<ChordAnalysisResponse | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (file: File) => {
    setSourceFile(file);
    setResult(null);
    setError(null);
    setIsAnalyzing(true);
    try { setResult(await analyzeChordAudio(file)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Analysis failed."); }
    finally { setIsAnalyzing(false); }
  }, []);

  const reset = useCallback(() => {
    setResult(null); setSourceFile(null); setError(null); setIsAnalyzing(false);
  }, []);

  return { result, sourceFile, isAnalyzing, error, analyze, reset };
}
