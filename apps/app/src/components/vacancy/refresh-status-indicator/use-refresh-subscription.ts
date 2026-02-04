import { useInngestSubscription } from "@inngest/realtime/hooks";
import { useCallback, useEffect, useState } from "react";
import {
  fetchRefreshVacancyResponsesToken,
  fetchScreenBatchToken,
  fetchSyncArchivedVacancyResponsesToken,
} from "~/actions/realtime";
import type {
  AnalyzeCompletedData,
  AnalyzeProgressData,
  ArchivedStatusData,
  ProgressData,
  ResultData,
  SyncMode,
} from "./types";

interface UseRefreshSubscriptionProps {
  vacancyId: string;
  mode: SyncMode;
  onVisibilityChange: (visible: boolean) => void;
  batchId?: string;
  workspaceId?: string;
}

export function useRefreshSubscription({
  vacancyId,
  mode,
  onVisibilityChange,
  batchId,
  workspaceId,
}: UseRefreshSubscriptionProps) {
  const [currentProgress, setCurrentProgress] = useState<ProgressData | null>(
    null,
  );
  const [currentResult, setCurrentResult] = useState<ResultData | null>(null);
  const [archivedStatus, setArchivedStatus] =
    useState<ArchivedStatusData | null>(null);
  const [analyzeProgress, setAnalyzeProgress] =
    useState<AnalyzeProgressData | null>(null);
  const [analyzeCompleted, setAnalyzeCompleted] =
    useState<AnalyzeCompletedData | null>(null);
  const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(
    null,
  );

  const isArchivedMode = mode === "archived";
  const isAnalyzeMode = mode === "analyze";

  // Мемоизируем функции получения токенов
  const getRefreshToken = useCallback(
    () => fetchRefreshVacancyResponsesToken(vacancyId),
    [vacancyId],
  );

  const getArchivedToken = useCallback(
    () => fetchSyncArchivedVacancyResponsesToken(vacancyId),
    [vacancyId],
  );

  const getAnalyzeToken = useCallback(() => {
    if (!batchId || !workspaceId) {
      throw new Error("batchId и workspaceId обязательны для режима analyze");
    }
    return fetchScreenBatchToken(workspaceId, batchId);
  }, [batchId, workspaceId]);

  // Подписываемся на канал Realtime для обычного обновления
  const { data: refreshData, error: refreshError } = useInngestSubscription({
    refreshToken: getRefreshToken,
    enabled: !isArchivedMode && !isAnalyzeMode,
  });

  // Подписываемся на канал Realtime для архивной синхронизации
  const { data: archivedData, error: archivedError } = useInngestSubscription({
    refreshToken: getArchivedToken,
    enabled: isArchivedMode,
  });

  // Подписываемся на канал Realtime для анализа откликов
  const { data: analyzeData, error: analyzeError } = useInngestSubscription({
    refreshToken: getAnalyzeToken,
    enabled: isAnalyzeMode && !!batchId && !!workspaceId,
  });

  const data = isArchivedMode
    ? archivedData
    : isAnalyzeMode
      ? analyzeData
      : refreshData;
  const error = isArchivedMode
    ? archivedError
    : isAnalyzeMode
      ? analyzeError
      : refreshError;

  // Обрабатываем все сообщения из канала
  useEffect(() => {
    if (data.length === 0) return;

    for (const message of data) {
      if (isArchivedMode && message.topic === "status") {
        const statusData = message.data as ArchivedStatusData;
        setArchivedStatus(statusData);
        onVisibilityChange(true);

        if (statusData.status === "completed") {
          const timer = setTimeout(() => {
            onVisibilityChange(false);
            setArchivedStatus(null);
          }, 3000);
          setAutoCloseTimer(timer);
        } else {
          setAutoCloseTimer((prev) => {
            if (prev) {
              clearTimeout(prev);
            }
            return null;
          });
        }
      } else if (isAnalyzeMode) {
        if (message.topic === "batch-progress") {
          const progressData = message.data as AnalyzeProgressData;
          setAnalyzeProgress(progressData);
          setAnalyzeCompleted(null);
          onVisibilityChange(true);

          setAutoCloseTimer((prev) => {
            if (prev) {
              clearTimeout(prev);
            }
            return null;
          });
        } else if (message.topic === "batch-completed") {
          const completedData = message.data as AnalyzeCompletedData;
          setAnalyzeCompleted(completedData);
          onVisibilityChange(true);

          const timer = setTimeout(() => {
            onVisibilityChange(false);
            setAnalyzeProgress(null);
            setAnalyzeCompleted(null);
          }, 5000);
          setAutoCloseTimer(timer);
        }
      } else if (!isArchivedMode && !isAnalyzeMode) {
        if (message.topic === "progress") {
          const progressData = message.data as ProgressData;
          setCurrentProgress(progressData);
          setCurrentResult(null);
          onVisibilityChange(true);

          setAutoCloseTimer((prev) => {
            if (prev) {
              clearTimeout(prev);
            }
            return null;
          });
        } else if (message.topic === "result") {
          const resultData = message.data as ResultData;
          setCurrentResult(resultData);
          onVisibilityChange(true);

          const timer = setTimeout(() => {
            onVisibilityChange(false);
            setCurrentProgress(null);
            setCurrentResult(null);
          }, 10000);
          setAutoCloseTimer(timer);
        }
      }
    }
  }, [data, isArchivedMode, isAnalyzeMode, onVisibilityChange]);

  // Очищаем таймер при размонтировании
  useEffect(() => {
    return () => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
    };
  }, [autoCloseTimer]);

  return {
    currentProgress,
    currentResult,
    archivedStatus,
    analyzeProgress,
    analyzeCompleted,
    error,
    clearAutoCloseTimer: () => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
        setAutoCloseTimer(null);
      }
    },
  };
}
