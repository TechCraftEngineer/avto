import { useInngestSubscription } from "@inngest/realtime/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import {
  fetchRefreshVacancyResponsesToken,
  fetchScreenBatchToken,
  fetchSyncArchivedVacancyResponsesToken,
} from "~/actions/realtime";
import { useTRPC } from "~/trpc/react";
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
  initialStatus?: {
    isRunning: boolean;
    status: string | null;
    message: string | null;
    eventType: string | null;
  } | null;
}

export function useRefreshSubscription({
  vacancyId,
  mode,
  onVisibilityChange,
  batchId,
  workspaceId,
  initialStatus,
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
  const [isConnecting, setIsConnecting] = useState(true);

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const isArchivedMode = mode === "archived";
  const isAnalyzeMode = mode === "analyze";
  const isScreeningMode = mode === "screening";

  // Устанавливаем начальное состояние из REST API
  useEffect(() => {
    if (initialStatus?.isRunning && initialStatus.message) {
      setIsConnecting(false);

      // Проверяем соответствие типа события текущему режиму
      const isMatchingMode =
        (isArchivedMode &&
          initialStatus.eventType === "vacancy/responses.sync-archived") ||
        (!isArchivedMode &&
          !isAnalyzeMode &&
          !isScreeningMode &&
          initialStatus.eventType === "vacancy/responses.refresh") ||
        ((isAnalyzeMode || isScreeningMode) &&
          initialStatus.eventType === "response/screen.batch");

      if (!isMatchingMode) {
        // Задание не соответствует текущему режиму, не показываем компонент
        return;
      }

      onVisibilityChange(true);

      // Определяем режим по типу события
      if (initialStatus.eventType === "vacancy/responses.sync-archived") {
        setArchivedStatus({
          status: "processing",
          message: initialStatus.message,
          vacancyId,
        });
      } else if (initialStatus.eventType === "vacancy/responses.refresh") {
        setCurrentProgress({
          status: "processing",
          message: initialStatus.message,
          vacancyId,
        });
      }
    } else {
      // Нет активного задания, скрываем индикатор подключения через таймаут
      const timeout = setTimeout(() => {
        setIsConnecting(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [
    initialStatus,
    vacancyId,
    onVisibilityChange,
    isArchivedMode,
    isAnalyzeMode,
    isScreeningMode,
  ]);

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
    enabled: !isArchivedMode && !isAnalyzeMode && !isScreeningMode,
  });

  // Подписываемся на канал Realtime для архивной синхронизации
  const { data: archivedData, error: archivedError } = useInngestSubscription({
    refreshToken: getArchivedToken,
    enabled: isArchivedMode,
  });

  // Логирование для диагностики
  useEffect(() => {
    if (isArchivedMode) {
      console.log(
        "[Archived Sync] Подписка активна, данных:",
        archivedData.length,
      );
      if (archivedError) {
        console.error("[Archived Sync] Ошибка подписки:", archivedError);
      }
    }
  }, [isArchivedMode, archivedData.length, archivedError]);

  // Подписываемся на канал Realtime для анализа/скрининга откликов
  const { data: analyzeData, error: analyzeError } = useInngestSubscription({
    refreshToken: getAnalyzeToken,
    enabled: (isAnalyzeMode || isScreeningMode) && !!batchId && !!workspaceId,
  });

  const data = isArchivedMode
    ? archivedData
    : isAnalyzeMode || isScreeningMode
      ? analyzeData
      : refreshData;
  const error = isArchivedMode
    ? archivedError
    : isAnalyzeMode || isScreeningMode
      ? analyzeError
      : refreshError;

  // Показываем индикатор сразу при подключении к активному заданию
  useEffect(() => {
    if (data.length > 0) {
      setIsConnecting(false);
      onVisibilityChange(true);
    }
  }, [data.length, onVisibilityChange]);

  // Обрабатываем все сообщения из канала
  useEffect(() => {
    if (data.length === 0) return;

    for (const message of data) {
      if (isArchivedMode && message.topic === "status") {
        const statusData = message.data as ArchivedStatusData;
        setArchivedStatus(statusData);
        onVisibilityChange(true);

        // Инвалидируем кэш откликов при обработке
        if (
          statusData.status === "processing" ||
          statusData.status === "completed"
        ) {
          queryClient.invalidateQueries({
            queryKey: trpc.vacancy.responses.list.queryKey({ vacancyId }),
          });
          queryClient.invalidateQueries({
            queryKey: trpc.vacancy.responses.getCount.queryKey({ vacancyId }),
          });
        }

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
      } else if (isAnalyzeMode || isScreeningMode) {
        if (message.topic === "batch-progress") {
          const progressData = message.data as AnalyzeProgressData;
          setAnalyzeProgress(progressData);
          setAnalyzeCompleted(null);
          onVisibilityChange(true);

          // Инвалидируем кэш откликов при обработке каждого отклика
          queryClient.invalidateQueries({
            queryKey: trpc.vacancy.responses.list.queryKey({ vacancyId }),
          });

          setAutoCloseTimer((prev) => {
            if (prev) {
              clearTimeout(prev);
            }
            return null;
          });
        } else if (message.topic === "batch-completed") {
          const data = message.data as {
            batchId: string;
            total: number;
            processed: number;
            failed: number;
            duration: number;
          };
          const completedData: AnalyzeCompletedData = {
            batchId: data.batchId,
            total: data.total,
            successful: data.total - data.failed,
            failed: data.failed,
          };
          setAnalyzeCompleted(completedData);
          onVisibilityChange(true);

          // Финальная инвалидация при завершении batch
          queryClient.invalidateQueries({
            queryKey: trpc.vacancy.responses.list.queryKey({ vacancyId }),
          });

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

          // Инвалидируем кэш откликов при обработке
          queryClient.invalidateQueries({
            queryKey: trpc.vacancy.responses.list.queryKey({ vacancyId }),
          });
          queryClient.invalidateQueries({
            queryKey: trpc.vacancy.responses.getCount.queryKey({ vacancyId }),
          });

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

          // Финальная инвалидация при завершении
          queryClient.invalidateQueries({
            queryKey: trpc.vacancy.responses.list.queryKey({ vacancyId }),
          });
          queryClient.invalidateQueries({
            queryKey: trpc.vacancy.responses.getCount.queryKey({ vacancyId }),
          });

          const timer = setTimeout(() => {
            onVisibilityChange(false);
            setCurrentProgress(null);
            setCurrentResult(null);
          }, 10000);
          setAutoCloseTimer(timer);
        }
      }
    }
  }, [
    data,
    isArchivedMode,
    isAnalyzeMode,
    isScreeningMode,
    onVisibilityChange,
  ]);

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
    isConnecting,
    clearAutoCloseTimer: () => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
        setAutoCloseTimer(null);
      }
    },
  };
}
