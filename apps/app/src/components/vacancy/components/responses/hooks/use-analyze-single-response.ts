"use client";

import { useInngestSubscription } from "@bunworks/inngest-realtime/hooks";
import { useCallback, useEffect, useState } from "react";
import { fetchAnalyzeResponseToken } from "~/actions/realtime";

interface AnalyzeProgress {
  responseId: string;
  status: "started" | "analyzing" | "completed" | "error";
  message: string;
}

interface AnalyzeResult {
  responseId: string;
  success: boolean;
  score?: number;
  error?: string;
}

interface UseAnalyzeSingleResponseProps {
  responseId: string;
  enabled: boolean;
}

export function useAnalyzeSingleResponse({
  responseId,
  enabled,
}: UseAnalyzeSingleResponseProps) {
  const [progress, setProgress] = useState<AnalyzeProgress | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const getToken = useCallback(
    () => fetchAnalyzeResponseToken(responseId),
    [responseId],
  );

  const { data, error } = useInngestSubscription({
    refreshToken: getToken,
    enabled,
  });

  useEffect(() => {
    if (data.length === 0) return;

    for (const message of data) {
      if (message.topic === "progress") {
        const progressData = message.data as AnalyzeProgress;
        setProgress(progressData);
        setResult(null);
        setIsAnalyzing(true);
      } else if (message.topic === "result") {
        const resultData = message.data as AnalyzeResult;
        setResult(resultData);
        setIsAnalyzing(false);
      }
    }
  }, [data]);

  const reset = useCallback(() => {
    setProgress(null);
    setResult(null);
    setIsAnalyzing(false);
  }, []);

  return {
    progress,
    result,
    isAnalyzing,
    error,
    reset,
  };
}
