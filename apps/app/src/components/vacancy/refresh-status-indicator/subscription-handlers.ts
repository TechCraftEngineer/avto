import type { QueryClient } from "@tanstack/react-query";
import {
  analyzeProgressDataSchema,
  analyzeResultDataSchema,
  archivedResultDataSchema,
  archivedStatusDataSchema,
  progressDataSchema,
  resultDataSchema,
} from "./schemas";
import type {
  AnalyzeCompletedData,
  AnalyzeProgressData,
  ArchivedStatusData,
  ProgressData,
  ResultData,
} from "./types";

type TRPCClient = {
  vacancy: {
    responses: {
      list: {
        queryKey: (input: { vacancyId: string }) => unknown[];
      };
      getRefreshStatus: {
        queryKey: (input: { vacancyId: string }) => unknown[];
      };
    };
  };
};

export interface MessageHandlerContext {
  vacancyId: string;
  queryClient: QueryClient;
  trpc: TRPCClient;
  onVisibilityChange: (visible: boolean) => void;
  onTaskComplete?: () => void;
  /** Вызывается при завершении sync archived (handleRefreshComplete) */
  onArchivedSyncComplete?: () => void;
  /** Вызывается при прогрессе screen-all (для контекста useScreeningState) */
  onAnalyzeProgress?: (
    message: string,
    progress: { total: number; processed: number; failed: number } | null,
  ) => void;
  /** Вызывается при завершении screen-all (onScreeningComplete) */
  onAnalyzeComplete?: () => void;
  setArchivedStatus: (status: ArchivedStatusData | null) => void;
  setAnalyzeProgress: (progress: AnalyzeProgressData | null) => void;
  setAnalyzeCompleted: (completed: AnalyzeCompletedData | null) => void;
  setCurrentProgress: (progress: ProgressData | null) => void;
  setCurrentResult: (result: ResultData | null) => void;
  setAutoCloseTimer: (
    timer: NodeJS.Timeout | null | ((prev: NodeJS.Timeout | null) => null),
  ) => void;
}

export function handleArchivedProgress(
  message: { data: unknown },
  context: MessageHandlerContext,
) {
  const parseResult = archivedStatusDataSchema.safeParse(message.data);
  if (!parseResult.success) {
    console.error("Ошибка валидации archived status data:", parseResult.error);
    return;
  }

  const progressData = parseResult.data;
  context.setArchivedStatus(progressData);
  context.onVisibilityChange(true);

  if (progressData.status === "error") {
    context.onArchivedSyncComplete?.();
  }

  // Не инвалидируем vacancy.responses.list при каждом progress: парсер шлёт progress
  // после КАЖДОГО отклика → сотни сообщений → массовая атака на list. Инвалидация
  // только при завершении (handleArchivedResult).

  // Очищаем таймер при получении нового прогресса
  context.setAutoCloseTimer((prev) => {
    if (prev) {
      clearTimeout(prev);
    }
    return null;
  });
}

export function handleArchivedResult(
  message: { data: unknown },
  context: MessageHandlerContext,
) {
  const parseResult = archivedResultDataSchema.safeParse(message.data);
  if (!parseResult.success) {
    console.error("Ошибка валидации archived result data:", parseResult.error);
    return;
  }

  const resultData = parseResult.data;

  // Показываем финальный статус с данными из result
  context.setArchivedStatus({
    status: "completed",
    message: `Синхронизация завершена. Обработано: ${resultData.syncedResponses}, новых: ${resultData.newResponses}`,
    vacancyId: resultData.vacancyId,
    syncedResponses: resultData.syncedResponses,
    newResponses: resultData.newResponses,
  });
  context.onVisibilityChange(true);

  // Финальная инвалидация при завершении
  context.queryClient.invalidateQueries({
    queryKey: context.trpc.vacancy.responses.list.queryKey({
      vacancyId: context.vacancyId,
    }),
  });

  // Инвалидируем статус задания, чтобы отключить подписку
  context.queryClient.invalidateQueries({
    queryKey: context.trpc.vacancy.responses.getRefreshStatus.queryKey({
      vacancyId: context.vacancyId,
    }),
  });

  context.onArchivedSyncComplete?.();

  const timer = setTimeout(() => {
    context.onVisibilityChange(false);
    context.setArchivedStatus(null);
    context.onTaskComplete?.();
  }, 3000);
  context.setAutoCloseTimer(timer);
}

export function handleAnalyzeProgress(
  message: { data: unknown },
  context: MessageHandlerContext,
) {
  const analyzeParseResult = analyzeProgressDataSchema.safeParse(message.data);

  if (analyzeParseResult.success) {
    const data = analyzeParseResult.data;

    // Преобразуем данные с сервера в формат компонента
    if (
      data.total !== undefined &&
      data.processed !== undefined &&
      data.failed !== undefined
    ) {
      const progressData: AnalyzeProgressData = {
        vacancyId: data.vacancyId,
        total: data.total,
        processed: data.processed,
        failed: data.failed,
      };

      const progressMessage =
        data.message ??
        `Обработано: ${data.processed} из ${data.total}`;
      context.onAnalyzeProgress?.(progressMessage, {
        total: data.total,
        processed: data.processed,
        failed: data.failed,
      });

      context.setAnalyzeProgress(progressData);
      context.setAnalyzeCompleted(null);
      context.onVisibilityChange(true);

      // Не инвалидируем vacancy.responses.list при каждом progress: при анализе
      // сотен откликов это вызывает массовые запросы. Инвалидация только при
      // завершении (handleAnalyzeResult).

      context.setAutoCloseTimer((prev) => {
        if (prev) {
          clearTimeout(prev);
        }
        return null;
      });
    }
  } else {
    console.error(
      "Ошибка валидации analyze progress data:",
      analyzeParseResult.error,
    );
  }
}

export function handleAnalyzeResult(
  message: { data: unknown },
  context: MessageHandlerContext,
) {
  const parseResult = analyzeResultDataSchema.safeParse(message.data);
  if (!parseResult.success) {
    console.error("Ошибка валидации analyze result data:", parseResult.error);
    return;
  }

  const resultData = parseResult.data;
  const completedData: AnalyzeCompletedData = {
    vacancyId: resultData.vacancyId,
    total: resultData.total,
    processed: resultData.processed,
    failed: resultData.failed,
  };
  context.setAnalyzeCompleted(completedData);
  context.onVisibilityChange(true);

  // Финальная инвалидация при завершении
  context.queryClient.invalidateQueries({
    queryKey: context.trpc.vacancy.responses.list.queryKey({
      vacancyId: context.vacancyId,
    }),
  });

  // Инвалидируем статус задания, чтобы отключить подписку
  context.queryClient.invalidateQueries({
    queryKey: context.trpc.vacancy.responses.getRefreshStatus.queryKey({
      vacancyId: context.vacancyId,
    }),
  });

  context.onAnalyzeComplete?.();
  context.onTaskComplete?.();
}

export function handleRefreshProgress(
  message: { data: unknown },
  context: MessageHandlerContext,
) {
  const parseResult = progressDataSchema.safeParse(message.data);
  if (!parseResult.success) {
    console.error("Ошибка валидации progress data:", parseResult.error);
    return;
  }

  const progressData = parseResult.data;
  context.setCurrentProgress(progressData);
  context.setCurrentResult(null);
  context.onVisibilityChange(true);

  // Не инвалидируем vacancy.responses.list при каждом progress: парсер шлёт
  // progress после КАЖДОГО отклика → массовые запросы. Инвалидация только при
  // завершении (handleRefreshResult).

  context.setAutoCloseTimer((prev) => {
    if (prev) {
      clearTimeout(prev);
    }
    return null;
  });
}

export function handleRefreshResult(
  message: { data: unknown },
  context: MessageHandlerContext,
) {
  const parseResult = resultDataSchema.safeParse(message.data);
  if (!parseResult.success) {
    console.error("Ошибка валидации result data:", parseResult.error);
    return;
  }

  const resultData = parseResult.data;
  context.setCurrentResult(resultData);
  context.onVisibilityChange(true);

  // Финальная инвалидация при завершении
  context.queryClient.invalidateQueries({
    queryKey: context.trpc.vacancy.responses.list.queryKey({
      vacancyId: context.vacancyId,
    }),
  });

  // Инвалидируем статус задания, чтобы отключить подписку
  context.queryClient.invalidateQueries({
    queryKey: context.trpc.vacancy.responses.getRefreshStatus.queryKey({
      vacancyId: context.vacancyId,
    }),
  });

  const timer = setTimeout(() => {
    context.onVisibilityChange(false);
    context.setCurrentProgress(null);
    context.setCurrentResult(null);
    context.onTaskComplete?.();
  }, 10000);
  context.setAutoCloseTimer(timer);
}
