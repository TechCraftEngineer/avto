import { useInngestSubscription } from "@inngest/realtime/hooks";
import { useEffect, useState } from "react";
import {
  fetchRefreshVacancyResponsesToken,
  fetchSyncArchivedVacancyResponsesToken,
} from "~/actions/realtime";
import type {
  ArchivedStatusData,
  ProgressData,
  ResultData,
  SyncMode,
} from "./types";

interface UseRefreshSubscriptionProps {
  vacancyId: string;
  mode: SyncMode;
  onVisibilityChange: (visible: boolean) => void;
}

export function useRefreshSubscription({
  vacancyId,
  mode,
  onVisibilityChange,
}: UseRefreshSubscriptionProps) {
  const [currentProgress, setCurrentProgress] = useState<ProgressData | null>(
    null,
  );
  const [currentResult, setCurrentResult] = useState<ResultData | null>(null);
  const [archivedStatus, setArchivedStatus] =
    useState<ArchivedStatusData | null>(null);
  const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(
    null,
  );

  const isArchivedMode = mode === "archived";

  // Подписываемся на канал Realtime для обычного обновления
  const { data: refreshData, error: refreshError } = useInngestSubscription({
    refreshToken: () => fetchRefreshVacancyResponsesToken(vacancyId),
    enabled: !isArchivedMode,
  });

  // Подписываемся на канал Realtime для архивной синхронизации
  const { data: archivedData, error: archivedError } = useInngestSubscription({
    refreshToken: () => fetchSyncArchivedVacancyResponsesToken(vacancyId),
    enabled: isArchivedMode,
  });

  const data = isArchivedMode ? archivedData : refreshData;
  const error = isArchivedMode ? archivedError : refreshError;

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
      } else if (!isArchivedMode) {
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
  }, [data, isArchivedMode, onVisibilityChange]);

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
    error,
    clearAutoCloseTimer: () => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
        setAutoCloseTimer(null);
      }
    },
  };
}
