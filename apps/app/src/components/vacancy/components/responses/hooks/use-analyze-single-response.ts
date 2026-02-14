"use client";

import { useInngestSubscription } from "@bunworks/inngest-realtime/hooks";
import {
  analyzeResponseProgressSchema,
  analyzeResponseResultSchema,
} from "@qbs-autonaim/jobs/channels";
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
  const [analysisError, setAnalysisError] = useState<string | null>(null);

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
        const parseResult = analyzeResponseProgressSchema.safeParse(
          message.data,
        );
        if (!parseResult.success) {
          console.error("Ошибка валидации progress data:", parseResult.error);
          continue;
        }
        const progressData = parseResult.data;
        setProgress(progressData);
        setResult(null);
        if (progressData.status === "error") {
          setIsAnalyzing(false);
          setAnalysisError(progressData.message);
        } else {
          setIsAnalyzing(true);
          setAnalysisError(null);
        }
      } else if (message.topic === "result") {
        const parseResult = analyzeResponseResultSchema.safeParse(message.data);
        if (!parseResult.success) {
          console.error("Ошибка валидации result data:", parseResult.error);
          continue;
        }
        const resultData = parseResult.data;
        setResult(resultData);
        setIsAnalyzing(false);
        setAnalysisError(null);
      }
    }
  }, [data]);

  const reset = useCallback(() => {
    setProgress(null);
    setResult(null);
    setIsAnalyzing(false);
    setAnalysisError(null);
  }, []);

  return {
    progress,
    result,
    isAnalyzing,
    error: error ?? analysisError,
    reset,
  };
}
