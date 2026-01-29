"use client";

import { useInngestSubscription } from "@inngest/realtime/hooks";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Progress,
} from "@qbs-autonaim/ui";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect } from "react";

interface ImportProgressProps {
  type: "new" | "archived" | "by-url";
  workspaceId: string;
  requestId?: string;
  token: unknown;
  onComplete: (result?: unknown) => void;
}

export function ImportProgress({
  type,
  token,
  onComplete,
}: ImportProgressProps) {
  // Подписываемся на канал Realtime
  const { data, error } = useInngestSubscription({
    refreshToken: async () => token,
    enabled: true,
  });

  // Получаем последнее сообщение
  const latestMessage = data[data.length - 1];
  const isCompleted = latestMessage?.topic === "result";
  const progressData =
    latestMessage?.topic === "progress" ? latestMessage.data : null;
  const resultData =
    latestMessage?.topic === "result" ? latestMessage.data : null;

  // Вычисляем прогресс для массового импорта
  const progress =
    progressData?.total && progressData.total > 0
      ? Math.round(((progressData.processed || 0) / progressData.total) * 100)
      : 0;

  // Автоматически вызываем onComplete при завершении
  useEffect(() => {
    if (isCompleted && resultData) {
      const timer = setTimeout(() => {
        onComplete(resultData);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isCompleted, resultData, onComplete]);

  // Получаем заголовок в зависимости от типа
  const getTitle = () => {
    if (isCompleted) {
      return resultData?.success ? "Импорт завершён" : "Ошибка импорта";
    }

    switch (type) {
      case "new":
        return "Импорт активных вакансий";
      case "archived":
        return "Импорт архивных вакансий";
      case "by-url":
        return "Импорт вакансии";
      default:
        return "Импорт вакансий";
    }
  };

  // Получаем описание статуса
  const getStatusMessage = () => {
    if (error) {
      return "Ошибка подключения к серверу";
    }

    if (!progressData && !resultData) {
      return "Подключение...";
    }

    if (progressData) {
      return progressData.message;
    }

    if (resultData) {
      if (type === "by-url") {
        return resultData.success
          ? "Вакансия успешно импортирована"
          : resultData.error || "Не удалось импортировать вакансию";
      }

      if (resultData.success) {
        const total = resultData.imported + resultData.updated;
        if (total === 0) {
          return "Новых вакансий не найдено";
        }
        return `Загружено ${total} ${total === 1 ? "вакансия" : "вакансий"}`;
      }

      return "Не удалось импортировать вакансии";
    }

    return "";
  };

  return (
    <Alert
      variant={
        error || (resultData && !resultData.success) ? "destructive" : "default"
      }
    >
      <div className="flex items-start gap-3">
        {isCompleted ? (
          resultData?.success ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
          ) : (
            <XCircle className="h-5 w-5 mt-0.5" />
          )
        ) : (
          <Loader2 className="h-5 w-5 animate-spin mt-0.5" />
        )}

        <div className="flex-1 space-y-2">
          <AlertTitle>{getTitle()}</AlertTitle>
          <AlertDescription>{getStatusMessage()}</AlertDescription>

          {/* Прогресс-бар для массового импорта */}
          {progressData?.total &&
            progressData.total > 0 &&
            type !== "by-url" && (
              <div className="space-y-1">
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {progressData.processed || 0} / {progressData.total}
                  </span>
                  <span>{progress}%</span>
                </div>
              </div>
            )}

          {/* Результаты для массового импорта */}
          {resultData?.success && type !== "by-url" && (
            <div className="grid grid-cols-3 gap-2 pt-2 text-sm">
              {resultData.imported > 0 && (
                <div className="text-center">
                  <div className="font-bold text-green-600">
                    {resultData.imported}
                  </div>
                  <div className="text-xs text-muted-foreground">Новых</div>
                </div>
              )}
              {resultData.updated > 0 && (
                <div className="text-center">
                  <div className="font-bold text-blue-600">
                    {resultData.updated}
                  </div>
                  <div className="text-xs text-muted-foreground">Обновлено</div>
                </div>
              )}
              {resultData.failed > 0 && (
                <div className="text-center">
                  <div className="font-bold text-destructive">
                    {resultData.failed}
                  </div>
                  <div className="text-xs text-muted-foreground">Ошибок</div>
                </div>
              )}
            </div>
          )}

          {isCompleted && (
            <p className="text-xs text-muted-foreground pt-1">
              Закроется автоматически через 3 секунды
            </p>
          )}
        </div>
      </div>
    </Alert>
  );
}
