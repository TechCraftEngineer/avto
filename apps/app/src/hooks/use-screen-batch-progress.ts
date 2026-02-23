"use client";

import { useInngestSubscription } from "@bunworks/inngest-realtime/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { fetchScreenBatchToken } from "~/actions/realtime";
import { useORPC } from "~/orpc/react";

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
 * @param vacancyId - при указании инвалидация ограничивается только этой вакансией
 */
export function useScreenBatchProgress(
  workspaceId: string | undefined,
  batchId: string | undefined,
  vacancyId?: string,
) {
  const orpc = useORPC();
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
  // biome-ignore lint/correctness/useExhaustiveDependencies: state reset on dependency change
  useEffect(() => {
    setScoredResponses([]);
    setProgress(null);
    setCompleted(null);
  }, [workspaceId, batchId]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: subscription effect with controlled dependencies
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

      // Инвалидируем список откликов после завершения (только vacancyId при указании)
      if (vacancyId) {
        queryClient.invalidateQueries({
          queryKey: orpc.vacancy.responses.list.queryKey({
            input: {
              workspaceId: workspaceId ?? "",
              vacancyId,
              sortDirection: "desc",
            },
          }),
        });
      }
    }
  }, [latestData]);

  return {
    scoredResponses,
    progress,
    completed,
    isProcessing: state === "active" && !completed,
    isConnected: state === "active",
    allMessages: data,
  };
}
