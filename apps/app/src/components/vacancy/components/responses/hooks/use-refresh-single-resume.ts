"use client";

import { useInngestSubscription } from "@qbs-autonaim/inngest-realtime/hooks";
import { useCallback, useEffect, useState } from "react";
import { fetchRefreshSingleResumeToken } from "~/actions/realtime";

interface RefreshProgress {
  responseId: string;
  status: "started" | "processing" | "completed" | "error";
  message: string;
}

interface RefreshResult {
  responseId: string;
  success: boolean;
  error?: string;
}

interface UseRefreshSingleResumeProps {
  responseId: string;
  enabled: boolean;
}

export function useRefreshSingleResume({
  responseId,
  enabled,
}: UseRefreshSingleResumeProps) {
  const [progress, setProgress] = useState<RefreshProgress | null>(null);
  const [result, setResult] = useState<RefreshResult | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getToken = useCallback(
    () => fetchRefreshSingleResumeToken(responseId),
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
        const progressData = message.data as RefreshProgress;
        setProgress(progressData);
        setResult(null);
        setIsRefreshing(true);
      } else if (message.topic === "result") {
        const resultData = message.data as RefreshResult;
        setResult(resultData);
        setIsRefreshing(false);
      }
    }
  }, [data]);

  const reset = useCallback(() => {
    setProgress(null);
    setResult(null);
    setIsRefreshing(false);
  }, []);

  return {
    progress,
    result,
    isRefreshing,
    error,
    reset,
  };
}
