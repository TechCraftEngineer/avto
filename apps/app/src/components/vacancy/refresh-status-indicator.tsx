"use client";

import { useInngestSubscription } from "@inngest/realtime/hooks";
import { cn } from "@qbs-autonaim/ui";
import { Card } from "@qbs-autonaim/ui/card";
import { useEffect, useState } from "react";
import { fetchRefreshVacancyResponsesToken } from "~/actions/realtime";

interface RefreshStatusIndicatorProps {
  vacancyId: string;
  className?: string;
}

type ProgressStatus = "started" | "processing" | "completed" | "error";

interface ProgressData {
  vacancyId: string;
  status: ProgressStatus;
  message: string;
  currentPage?: number;
  totalSaved?: number;
  totalSkipped?: number;
}

interface ResultData {
  vacancyId: string;
  success: boolean;
  newCount: number;
  totalResponses: number;
  error?: string;
}

export function RefreshStatusIndicator({
  vacancyId,
  className,
}: RefreshStatusIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(
    null,
  );

  // Подписываемся на канал Realtime
  const { data, error } = useInngestSubscription({
    refreshToken: () => fetchRefreshVacancyResponsesToken(vacancyId),
    enabled: true,
  });

  // Получаем последнее сообщение
  const latestMessage = data[data.length - 1];
  const progressData =
    latestMessage?.topic === "progress"
      ? (latestMessage.data as ProgressData)
      : null;
  const resultData =
    latestMessage?.topic === "result"
      ? (latestMessage.data as ResultData)
      : null;

  // Показываем индикатор при получении данных
  useEffect(() => {
    if (progressData || resultData) {
      setIsVisible(true);
    }
  }, [progressData, resultData]);

  // Автоматически скрываем после завершения
  useEffect(() => {
    if (resultData) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 10000);
      setAutoCloseTimer(timer);
    }

    return () => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
    };
  }, [resultData, autoCloseTimer]);

  if (!isVisible) {
    return null;
  }

  const getStatusColor = (status?: ProgressStatus) => {
    switch (status) {
      case "started":
        return "bg-blue-500";
      case "processing":
        return "bg-yellow-500";
      case "completed":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status?: ProgressStatus) => {
    switch (status) {
      case "started":
      case "processing":
        return (
          <svg
            className="w-4 h-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      case "completed":
        return (
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const currentStatus =
    progressData?.status || (resultData ? "completed" : undefined);

  return (
    <Card
      className={cn(
        "border-none shadow-lg bg-card/95 backdrop-blur-xl overflow-hidden animate-in slide-in-from-top-4 duration-300",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-white shrink-0",
              getStatusColor(currentStatus),
            )}
            aria-hidden="true"
          >
            {getStatusIcon(currentStatus)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h4 className="text-sm font-semibold">
                {progressData?.status === "started" && "Запуск обновления"}
                {progressData?.status === "processing" && "Получение откликов"}
                {progressData?.status === "completed" && "Обновление завершено"}
                {progressData?.status === "error" && "Ошибка обновления"}
                {resultData && "Обновление завершено"}
              </h4>
              {progressData?.currentPage && (
                <span className="text-xs text-muted-foreground shrink-0">
                  Страница&nbsp;{progressData.currentPage}
                </span>
              )}
            </div>

            {progressData && (
              <>
                <p className="text-xs text-muted-foreground mb-2">
                  {progressData.message}
                </p>

                {(progressData.totalSaved !== undefined ||
                  progressData.totalSkipped !== undefined) && (
                  <div className="flex gap-4 text-xs">
                    {progressData.totalSaved !== undefined && (
                      <div className="flex items-center gap-1">
                        <span
                          className="text-green-600 dark:text-green-400"
                          aria-hidden="true"
                        >
                          ✓
                        </span>
                        <span className="text-muted-foreground">
                          Сохранено: {progressData.totalSaved}
                        </span>
                      </div>
                    )}
                    {progressData.totalSkipped !== undefined && (
                      <div className="flex items-center gap-1">
                        <span
                          className="text-yellow-600 dark:text-yellow-400"
                          aria-hidden="true"
                        >
                          ⊘
                        </span>
                        <span className="text-muted-foreground">
                          Пропущено: {progressData.totalSkipped}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {resultData && (
              <div className="mt-3 pt-3 border-t">
                {resultData.success ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      Успешно!
                    </span>
                    <span className="text-muted-foreground">
                      Новых: {resultData.newCount} • Всего:{" "}
                      {resultData.totalResponses}
                    </span>
                  </div>
                ) : (
                  <div className="text-sm text-red-600 dark:text-red-400">
                    {resultData.error || "Произошла ошибка"}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600 dark:text-red-400">
                Ошибка подключения к серверу
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setIsVisible(false);
              if (autoCloseTimer) {
                clearTimeout(autoCloseTimer);
                setAutoCloseTimer(null);
              }
            }}
            className="p-1 hover:bg-muted rounded-md transition-colors shrink-0 touch-manipulation min-w-[24px] min-h-[24px] flex items-center justify-center"
            aria-label="Закрыть уведомление"
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </Card>
  );
}
