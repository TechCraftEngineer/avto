import { useInngestSubscription } from "@bunworks/inngest-realtime/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import {
  fetchRefreshVacancyResponsesToken,
  fetchScreenAllResponsesToken,
  fetchScreenBatchToken,
  fetchScreenNewResponsesToken,
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
        (mode === "refresh" &&
          initialStatus.eventType === "vacancy/responses.refresh") ||
        (isScreeningMode &&
          initialStatus.eventType === "response/screen.new") ||
        (isAnalyzeMode && initialStatus.eventType === "response/screen.batch");

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
      } else if (
        initialStatus.eventType === "vacancy/responses.refresh" ||
        initialStatus.eventType === "response/screen.new"
      ) {
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
    mode,
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

  const getScreeningToken = useCallback(
    () => fetchScreenNewResponsesToken(vacancyId),
    [vacancyId],
  );

  const getAnalyzeToken = useCallback(
    () => fetchScreenAllResponsesToken(vacancyId),
    [vacancyId],
  );

  // Подписываемся на канал Realtime для обычного обновления
  const { data: refreshData, error: refreshError } = useInngestSubscription({
    refreshToken: getRefreshToken,
    enabled: mode === "refresh",
  });

  // Подписываемся на канал Realtime для архивной синхронизации
  const { data: archivedData, error: archivedError } = useInngestSubscription({
    refreshToken: getArchivedToken,
    enabled: isArchivedMode,
  });

  // Подписываемся на канал Realtime для скрининга новых откликов
  const { data: screeningData, error: screeningError } = useInngestSubscription(
    {
      refreshToken: getScreeningToken,
      enabled: isScreeningMode,
    },
  );

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
    if (isScreeningMode) {
      console.log(
        "[Screening] Подписка активна, данных:",
        screeningData.length,
      );
      if (screeningError) {
        console.error("[Screening] Ошибка подписки:", screeningError);
      }
    }
  }, [
    isArchivedMode,
    archivedData.length,
    archivedError,
    isScreeningMode,
    screeningData.length,
    screeningError,
  ]);

  // Подписываемся на канал Realtime для анализа откликов (screen.all)
  const { data: analyzeData, error: analyzeError } = useInngestSubscription({
    refreshToken: getAnalyzeToken,
    enabled: isAnalyzeMode,
  });

  const data = isArchivedMode
    ? archivedData
    : isScreeningMode
      ? screeningData
      : isAnalyzeMode
        ? analyzeData
        : refreshData;
  const error = isArchivedMode
    ? archivedError
    : isScreeningMode
      ? screeningError
      : isAnalyzeMode
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
      } else if (isAnalyzeMode) {
        if (message.topic === "progress") {
          const progressData = message.data as ProgressData & {
            total?: number;
            processed?: number;
            failed?: number;
          };

          // Преобразуем в формат AnalyzeProgressData
          if (progressData.total !== undefined) {
            setAnalyzeProgress({
              batchId: vacancyId, // используем vacancyId как batchId
              total: progressData.total,
              processed: progressData.processed || 0,
              successful:
                (progressData.processed || 0) - (progressData.failed || 0),
              failed: progressData.failed || 0,
            });
          }
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
        } else if (message.topic === "result") {
          const resultData = message.data as {
            vacancyId: string;
            success: boolean;
            total: number;
            processed: number;
            failed: number;
          };
          const completedData: AnalyzeCompletedData = {
            batchId: vacancyId,
            total: resultData.total,
            successful: resultData.processed,
            failed: resultData.failed,
          };
          setAnalyzeCompleted(completedData);
          onVisibilityChange(true);

          // Финальная инвалидация при завершении
          queryClient.invalidateQueries({
            queryKey: trpc.vacancy.responses.list.queryKey({ vacancyId }),
          });

          // Не закрываем окно автоматически для режима analyze
        }
      } else if (mode === "refresh" || isScreeningMode) {
        // Обработка для refresh и screening (используют одинаковую структуру событий)
        if (message.topic === "progress") {
          const progressData = message.data as ProgressData;
          setCurrentProgress(progressData);
          setCurrentResult(null);
          onVisibilityChange(true);

          // Инвалидируем кэш откликов при обработке
          queryClient.invalidateQueries({
            queryKey: trpc.vacancy.responses.list.queryKey({ vacancyId }),
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
    mode,
    onVisibilityChange,
    queryClient,
    trpc.vacancy.responses.list,
    vacancyId,
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
