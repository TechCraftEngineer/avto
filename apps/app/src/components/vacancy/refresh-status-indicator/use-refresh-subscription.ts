import { useInngestSubscription } from "@bunworks/inngest-realtime/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
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
  /** Флаг что пользователь только что запустил задание (до того как API вернёт isRunning) */
  taskStarted?: boolean;
  /** Вызывается при завершении задания (для сброса taskStarted) */
  onTaskComplete?: () => void;
  /** Вызывается при завершении sync archived (handleRefreshComplete) */
  onArchivedSyncComplete?: () => void;
  /** Вызывается при прогрессе screen-all */
  onAnalyzeProgress?: (
    message: string,
    progress: { total: number; processed: number; failed: number } | null,
  ) => void;
  /** Вызывается при завершении screen-all */
  onAnalyzeComplete?: () => void;
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
  taskStarted = false,
  onTaskComplete,
  onArchivedSyncComplete,
  onAnalyzeProgress,
  onAnalyzeComplete,
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

  // Refs для колбэков — не включаем их в deps useEffect, иначе бесконечный цикл
  // при пересоздании колбэков родителем на каждом рендере
  const onVisibilityChangeRef = useRef(onVisibilityChange);
  const onTaskCompleteRef = useRef(onTaskComplete);
  const onArchivedSyncCompleteRef = useRef(onArchivedSyncComplete);
  const onAnalyzeProgressRef = useRef(onAnalyzeProgress);
  const onAnalyzeCompleteRef = useRef(onAnalyzeComplete);
  onVisibilityChangeRef.current = onVisibilityChange;
  onTaskCompleteRef.current = onTaskComplete;
  onArchivedSyncCompleteRef.current = onArchivedSyncComplete;
  onAnalyzeProgressRef.current = onAnalyzeProgress;
  onAnalyzeCompleteRef.current = onAnalyzeComplete;

  // Отслеживаем, сколько сообщений уже обработано — не обрабатываем повторно
  const lastProcessedLengthRef = useRef(0);

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
  // taskStarted нужен чтобы подписаться сразу после клика, пока API ещё не вернул isRunning
  const hasActiveTask =
    taskStarted || checkActiveTask(mode, initialStatus);

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

  // Обрабатываем сообщения из канала. Используем refs для колбэков и
  // обрабатываем только новые сообщения, чтобы избежать бесконечного цикла.
  useEffect(() => {
    if (data.length === 0) {
      lastProcessedLengthRef.current = 0;
      return;
    }

    // Подписка могла очистить данные — сбрасываем счётчик
    if (data.length < lastProcessedLengthRef.current) {
      lastProcessedLengthRef.current = 0;
    }

    const context = {
      vacancyId,
      queryClient,
      trpc,
      onVisibilityChange: (visible: boolean) =>
        onVisibilityChangeRef.current?.(visible),
      onTaskComplete: () => onTaskCompleteRef.current?.(),
      onArchivedSyncComplete: () => onArchivedSyncCompleteRef.current?.(),
      onAnalyzeProgress: (
        message: string,
        progress: { total: number; processed: number; failed: number } | null,
      ) => onAnalyzeProgressRef.current?.(message, progress),
      onAnalyzeComplete: () => onAnalyzeCompleteRef.current?.(),
      setArchivedStatus,
      setAnalyzeProgress,
      setAnalyzeCompleted,
      setCurrentProgress,
      setCurrentResult,
      setAutoCloseTimer,
    };

    for (let i = lastProcessedLengthRef.current; i < data.length; i++) {
      const msg = data[i];
      if (!msg) continue;
      const isProgressTopic = msg.topic === "progress";
      const isResultTopic = msg.topic === "result";

      if (isArchivedMode && isProgressTopic) {
        handleArchivedProgress(msg, context);
      } else if (isArchivedMode && isResultTopic) {
        handleArchivedResult(msg, context);
      } else if (isAnalyzeMode && isProgressTopic) {
        handleAnalyzeProgress(msg, context);
      } else if (isAnalyzeMode && isResultTopic) {
        handleAnalyzeResult(msg, context);
      } else if ((mode === "refresh" || isScreeningMode) && isProgressTopic) {
        handleRefreshProgress(msg, context);
      } else if ((mode === "refresh" || isScreeningMode) && isResultTopic) {
        handleRefreshResult(msg, context);
      }
    }
    lastProcessedLengthRef.current = data.length;
  }, [
    data,
    isArchivedMode,
    isAnalyzeMode,
    isScreeningMode,
    mode,
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
