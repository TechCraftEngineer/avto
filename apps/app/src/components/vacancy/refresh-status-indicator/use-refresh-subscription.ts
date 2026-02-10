import { useInngestSubscription } from "@bunworks/inngest-realtime/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { match } from "ts-pattern";
import {
  fetchRefreshVacancyResponsesToken,
  fetchScreenAllResponsesToken,
  fetchScreenNewResponsesToken,
  fetchSyncArchivedVacancyResponsesToken,
} from "~/actions/realtime";
import { useTRPC } from "~/trpc/react";
import { restoreProgressFromInitialStatus } from "./initial-status-handler";
import { checkActiveTask, checkMatchingMode, getModeFlags } from "./mode-utils";
import {
  handleAnalyzeProgress,
  handleAnalyzeResult,
  handleArchivedProgress,
  handleArchivedResult,
  handleRefreshProgress,
  handleRefreshResult,
} from "./subscription-handlers";
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
  initialStatus?: {
    isRunning: boolean;
    status: string | null;
    message: string | null;
    eventType: string | null;
    progress?: {
      currentPage?: number;
      totalSaved?: number;
      totalSkipped?: number;
      total?: number;
      processed?: number;
      failed?: number;
      newCount?: number;
    } | null;
    runId?: string | null;
    startedAt?: string | null;
  } | null;
}

export function useRefreshSubscription({
  vacancyId,
  mode,
  onVisibilityChange,
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

  // Определяем режим через pattern matching
  const { isArchivedMode, isAnalyzeMode, isScreeningMode } = getModeFlags(mode);

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

  // Определяем, есть ли активное задание для текущего режима
  const hasActiveTask = checkActiveTask(mode, initialStatus);

  // ОДНО подключение для текущего режима
  // Подключаемся ТОЛЬКО если есть активное задание для этого режима
  const refreshSubscription = useInngestSubscription({
    refreshToken: getRefreshToken,
    enabled: mode === "refresh" && hasActiveTask,
    key: "refresh",
  });

  const archivedSubscription = useInngestSubscription({
    refreshToken: getArchivedToken,
    enabled: isArchivedMode && hasActiveTask,
    key: "archived",
  });

  const screeningSubscription = useInngestSubscription({
    refreshToken: getScreeningToken,
    enabled: isScreeningMode && hasActiveTask,
    key: "screening",
  });

  const analyzeSubscription = useInngestSubscription({
    refreshToken: getAnalyzeToken,
    enabled: isAnalyzeMode && hasActiveTask,
    key: "analyze",
  });

  // Выбираем данные из активной подписки через pattern matching
  // Обеспечиваем, что data всегда массив (никогда не undefined)
  const data = match(mode)
    .with("archived", () => archivedSubscription.data ?? [])
    .with("screening", () => screeningSubscription.data ?? [])
    .with("analyze", () => analyzeSubscription.data ?? [])
    .with("refresh", () => refreshSubscription.data ?? [])
    .exhaustive();

  const error = match(mode)
    .with("archived", () => archivedSubscription.error)
    .with("screening", () => screeningSubscription.error)
    .with("analyze", () => analyzeSubscription.error)
    .with("refresh", () => refreshSubscription.error)
    .exhaustive();

  // Периодическая проверка статуса для восстановления после перезагрузки
  // Проверяем каждые 5 секунд если есть активное задание
  useEffect(() => {
    if (!hasActiveTask) return;

    const intervalId = setInterval(() => {
      // Обновляем статус через REST API
      queryClient.invalidateQueries({
        queryKey: trpc.vacancy.responses.getRefreshStatus.queryKey({
          vacancyId,
        }),
      });
    }, 5000);

    return () => clearInterval(intervalId);
  }, [hasActiveTask, queryClient, trpc, vacancyId]);

  // Устанавливаем начальное состояние из REST API
  useEffect(() => {
    if (initialStatus?.isRunning && initialStatus.message) {
      setIsConnecting(false);

      // Проверяем соответствие типа события текущему режиму
      const isMatchingMode = checkMatchingMode(mode, initialStatus.eventType);

      if (!isMatchingMode) {
        // Задание не соответствует текущему режиму, не показываем компонент
        return;
      }

      onVisibilityChange(true);

      // Восстанавливаем прогресс из REST API если доступен
      if (initialStatus.message) {
        const validStatus: import("./initial-status-handler").InitialStatus = {
          ...initialStatus,
          message: initialStatus.message,
        };
        restoreProgressFromInitialStatus(validStatus, vacancyId, {
          setArchivedStatus,
          setCurrentProgress,
          setAnalyzeProgress,
        });
      }
    } else {
      // Нет активного задания, скрываем индикатор подключения через таймаут
      const timeout = setTimeout(() => {
        setIsConnecting(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [initialStatus, vacancyId, onVisibilityChange, mode]);

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

    const context = {
      vacancyId,
      queryClient,
      trpc,
      onVisibilityChange,
      setArchivedStatus,
      setAnalyzeProgress,
      setAnalyzeCompleted,
      setCurrentProgress,
      setCurrentResult,
      setAutoCloseTimer,
    };

    for (const message of data) {
      const isProgressTopic = message.topic === "progress";
      const isResultTopic = message.topic === "result";

      if (isArchivedMode && isProgressTopic) {
        handleArchivedProgress(message, context);
      } else if (isArchivedMode && isResultTopic) {
        handleArchivedResult(message, context);
      } else if (isAnalyzeMode && isProgressTopic) {
        handleAnalyzeProgress(message, context);
      } else if (isAnalyzeMode && isResultTopic) {
        handleAnalyzeResult(message, context);
      } else if ((mode === "refresh" || isScreeningMode) && isProgressTopic) {
        handleRefreshProgress(message, context);
      } else if ((mode === "refresh" || isScreeningMode) && isResultTopic) {
        handleRefreshResult(message, context);
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
    trpc,
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
