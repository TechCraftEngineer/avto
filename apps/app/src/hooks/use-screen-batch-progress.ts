"use client";

import { useInngestSubscription } from "@bunworks/inngest-realtime/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { fetchScreenBatchToken } from "~/actions/realtime";
import { useTRPC } from "~/trpc/react";

interface ResponseScored {
  responseId: string;
  candidateName: string;
  score: number;
  status: "processing" | "completed" | "failed";
  error?: string;
}

interface BatchProgress {
  total: number;
  processed: number;
  failed: number;
  currentCandidate?: string;
}

interface BatchCompleted {
  total: number;
  processed: number;
  failed: number;
  duration: number;
}

/**
 * Хук для отслеживания прогресса batch скрининга откликов
 * Показывает детальный прогресс оценки каждого кандидата
 */
export function useScreenBatchProgress(
  workspaceId: string | undefined,
  batchId: string | undefined,
) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [scoredResponses, setScoredResponses] = useState<ResponseScored[]>([]);
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [completed, setCompleted] = useState<BatchCompleted | null>(null);

  const { data, latestData, state } = useInngestSubscription({
    refreshToken: async () => {
      if (!workspaceId || !batchId) return null;
      const token = await fetchScreenBatchToken(workspaceId, batchId);
      return token;
    },
    enabled: Boolean(workspaceId && batchId),
  });

  // Reset state when workspaceId or batchId change
  useEffect(() => {
    setScoredResponses([]);
    setProgress(null);
    setCompleted(null);
  }, []);

  useEffect(() => {
    if (!latestData) return;

    const topic = latestData.topic;

    if (topic === "response-scored") {
      const scored = latestData.data as ResponseScored;
      setScoredResponses((prev) => [...prev, scored]);

      // Не инвалидируем отдельные отклики при каждом scored - это вызывает
      // множественные запросы. Инвалидация списка после завершения батча
      // обновит все данные разом.
    } else if (topic === "batch-progress") {
      setProgress(latestData.data as BatchProgress);
    } else if (topic === "batch-completed") {
      const completedData = latestData.data as BatchCompleted;
      setCompleted(completedData);

      // Инвалидируем список откликов после завершения
      queryClient.invalidateQueries({
        queryKey: trpc.vacancy.responses.list.queryKey(),
      });
    }
  }, [latestData, queryClient, trpc]);

  return {
    scoredResponses,
    progress,
    completed,
    isProcessing: state === "active" && !completed,
    isConnected: state === "active",
    allMessages: data,
  };
}
