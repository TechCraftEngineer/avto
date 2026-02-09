import { useInngestSubscription } from "@bunworks/inngest-realtime/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import {
  fetchRefreshVacancyResponsesToken,
  fetchScreenAllResponsesToken,
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

// Zod схемы для валидации данных из realtime сообщений
const progressStatusSchema = z.enum([
  "started",
  "processing",
  "completed",
  "error",
]);

const progressDataSchema = z.object({
  vacancyId: z.string(),
  status: progressStatusSchema,
  message: z.string(),
  currentPage: z.number().optional(),
  totalSaved: z.number().optional(),
  totalSkipped: z.number().optional(),
});

const archivedStatusDataSchema = z.object({
  status: progressStatusSchema,
  message: z.string(),
  vacancyId: z.string(),
  syncedResponses: z.number().optional(),
  newResponses: z.number().optional(),
  vacancyTitle: z.string().optional(),
});

const analyzeProgressDataSchema = z.object({
  batchId: z.string(),
  total: z.number(),
  processed: z.number(),
  successful: z.number(),
  failed: z.number(),
});

const analyzeResultDataSchema = z.object({
  vacancyId: z.string(),
  success: z.boolean(),
  total: z.number(),
  processed: z.number(),
  failed: z.number(),
});

const resultDataSchema = z.object({
  vacancyId: z.string(),
  success: z.boolean(),
  newCount: z.number(),
  totalResponses: z.number(),
  error: z.string().optional(),
});

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

  const isArchivedMode = mode === "archived";
  const isAnalyzeMode = mode === "analyze";
  const isScreeningMode = mode === "screening";

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
  const hasActiveTask =
    initialStatus?.isRunning === true &&
    ((isArchivedMode &&
      initialStatus.eventType === "vacancy/responses.sync-archived") ||
      (mode === "refresh" &&
        initialStatus.eventType === "vacancy/responses.refresh") ||
      (isScreeningMode && initialStatus.eventType === "response/screen.new") ||
      (isAnalyzeMode && initialStatus.eventType === "response/screen.batch"));

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

  // Выбираем данные из активной подписки
  const data = isArchivedMode
    ? archivedSubscription.data
    : isScreeningMode
      ? screeningSubscription.data
      : isAnalyzeMode
        ? analyzeSubscription.data
        : refreshSubscription.data;

  const error = isArchivedMode
    ? archivedSubscription.error
    : isScreeningMode
      ? screeningSubscription.error
      : isAnalyzeMode
        ? analyzeSubscription.error
        : refreshSubscription.error;

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

      // Восстанавливаем прогресс из REST API если доступен
      if (initialStatus.progress) {
        // Определяем режим по типу события
        if (initialStatus.eventType === "vacancy/responses.sync-archived") {
          setArchivedStatus({
            status: "processing",
            message: initialStatus.message,
            vacancyId,
            syncedResponses: initialStatus.progress.totalSaved,
            newResponses: initialStatus.progress.newCount,
          });
        } else if (
          initialStatus.eventType === "vacancy/responses.refresh" ||
          initialStatus.eventType === "response/screen.new"
        ) {
          setCurrentProgress({
            status: "processing",
            message: initialStatus.message,
            vacancyId,
            currentPage: initialStatus.progress.currentPage,
            totalSaved: initialStatus.progress.totalSaved,
            totalSkipped: initialStatus.progress.totalSkipped,
          });
        } else if (initialStatus.eventType === "response/screen.batch") {
          // Для analyze режима
          if (
            initialStatus.progress.total !== undefined &&
            initialStatus.progress.processed !== undefined
          ) {
            setAnalyzeProgress({
              batchId: vacancyId,
              total: initialStatus.progress.total,
              processed: initialStatus.progress.processed,
              successful:
                (initialStatus.progress.processed || 0) -
                (initialStatus.progress.failed || 0),
              failed: initialStatus.progress.failed || 0,
            });
          }
        }
      } else {
        // Нет деталей прогресса, показываем базовое сообщение
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
      // Канал syncArchivedResponsesChannel использует топик "status" вместо "progress"
      const isProgressTopic =
        message.topic === "progress" || message.topic === "status";
      const isResultTopic = message.topic === "result";

      if (isArchivedMode && isProgressTopic) {
        const parseResult = archivedStatusDataSchema.safeParse(message.data);
        if (!parseResult.success) {
          console.error(
            "Ошибка валидации archived status data:",
            parseResult.error,
          );
          continue;
        }

        const progressData = parseResult.data;
        setArchivedStatus(progressData);
        onVisibilityChange(true);

        // Инвалидируем кэш откликов при обработке
        if (
          progressData.status === "processing" ||
          progressData.status === "completed"
        ) {
          queryClient.invalidateQueries({
            queryKey: trpc.vacancy.responses.list.queryKey({ vacancyId }),
          });
        }

        if (progressData.status === "completed") {
          // Инвалидируем статус задания, чтобы отключить подписку
          queryClient.invalidateQueries({
            queryKey: trpc.vacancy.responses.getRefreshStatus.queryKey({
              vacancyId,
            }),
          });

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
      } else if (isAnalyzeMode && isProgressTopic) {
        // Пытаемся распарсить как AnalyzeProgressData
        const analyzeParseResult = analyzeProgressDataSchema.safeParse(
          message.data,
        );

        if (analyzeParseResult.success) {
          setAnalyzeProgress(analyzeParseResult.data);
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
        } else {
          console.error(
            "Ошибка валидации analyze progress data:",
            analyzeParseResult.error,
          );
        }
      } else if (isAnalyzeMode && isResultTopic) {
        const parseResult = analyzeResultDataSchema.safeParse(message.data);
        if (!parseResult.success) {
          console.error(
            "Ошибка валидации analyze result data:",
            parseResult.error,
          );
          continue;
        }

        const resultData = parseResult.data;
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

        // Инвалидируем статус задания, чтобы отключить подписку
        queryClient.invalidateQueries({
          queryKey: trpc.vacancy.responses.getRefreshStatus.queryKey({
            vacancyId,
          }),
        });

        // Не закрываем окно автоматически для режима analyze
      } else if ((mode === "refresh" || isScreeningMode) && isProgressTopic) {
        // Обработка для refresh и screening (используют одинаковую структуру событий)
        const parseResult = progressDataSchema.safeParse(message.data);
        if (!parseResult.success) {
          console.error("Ошибка валидации progress data:", parseResult.error);
          continue;
        }

        const progressData = parseResult.data;
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
      } else if ((mode === "refresh" || isScreeningMode) && isResultTopic) {
        const parseResult = resultDataSchema.safeParse(message.data);
        if (!parseResult.success) {
          console.error("Ошибка валидации result data:", parseResult.error);
          continue;
        }

        const resultData = parseResult.data;
        setCurrentResult(resultData);
        onVisibilityChange(true);

        // Финальная инвалидация при завершении
        queryClient.invalidateQueries({
          queryKey: trpc.vacancy.responses.list.queryKey({ vacancyId }),
        });

        // Инвалидируем статус задания, чтобы отключить подписку
        queryClient.invalidateQueries({
          queryKey: trpc.vacancy.responses.getRefreshStatus.queryKey({
            vacancyId,
          }),
        });

        const timer = setTimeout(() => {
          onVisibilityChange(false);
          setCurrentProgress(null);
          setCurrentResult(null);
        }, 10000);
        setAutoCloseTimer(timer);
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
    trpc.vacancy.responses.getRefreshStatus,
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
