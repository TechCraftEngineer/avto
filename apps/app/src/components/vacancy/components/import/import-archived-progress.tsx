"use client";

import { useInngestSubscription } from "@bunworks/inngest-realtime/hooks";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Progress,
} from "@qbs-autonaim/ui";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchImportArchivedVacanciesToken } from "~/actions/vacancy-import";

interface ImportArchivedProgressProps {
  workspaceId: string;
  onComplete: () => void;
}

export function ImportArchivedProgress({
  workspaceId,
  onComplete,
}: ImportArchivedProgressProps) {
  const [isCompleted, setIsCompleted] = useState(false);

  const { data, error } = useInngestSubscription({
    refreshToken: () => fetchImportArchivedVacanciesToken(workspaceId),
    enabled: !isCompleted,
  });

  const lastMessage = data[data.length - 1];

  // Определение состояния завершения
  useEffect(() => {
    if (lastMessage?.topic === "result") {
      setIsCompleted(true);
    }
  }, [lastMessage]);

  const isError =
    error ||
    (lastMessage?.topic === "result" &&
      "error" in lastMessage.data &&
      lastMessage.data.error);
  const isSuccess = isCompleted && !isError;

  // Данные прогресса
  const progress = lastMessage?.topic === "progress" ? lastMessage.data : null;
  const total = progress?.total || 0;
  const processed = progress?.processed || 0;
  const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;

  // Результаты
  const result = lastMessage?.topic === "result" ? lastMessage.data : null;

  // Сообщение о статусе
  const getMessage = () => {
    if (error) return "Ошибка подключения";
    if (!lastMessage) return "Подключение...";

    if (progress?.message) return progress.message;

    if (result) {
      if (result.error) return result.error;
      const total = (result.imported || 0) + (result.updated || 0);
      if (total === 0) return "Новых вакансий не найдено";

      const parts = [];
      if (result.imported) parts.push(`${result.imported} новых`);
      if (result.updated) parts.push(`${result.updated} обновлено`);
      return `Загружено: ${parts.join(", ")}`;
    }

    return "";
  };

  // Иконка статуса
  const StatusIcon = isCompleted
    ? isSuccess
      ? CheckCircle2
      : XCircle
    : Loader2;

  const iconClass = isCompleted
    ? isSuccess
      ? "text-green-600"
      : "text-destructive"
    : "animate-spin text-primary";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <StatusIcon className={`h-6 w-6 ${iconClass}`} />
          <div className="flex-1">
            <CardTitle>
              {isCompleted
                ? isSuccess
                  ? "Импорт завершён"
                  : "Ошибка импорта"
                : "Импорт архивных вакансий"}
            </CardTitle>
            <CardDescription>{getMessage()}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Прогресс */}
        {!isCompleted && total > 0 && (
          <div className="space-y-2">
            <Progress value={percentage} />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {processed} / {total}
              </span>
              <span>{percentage}%</span>
            </div>
            {progress?.currentVacancy?.title && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Обрабатывается:</span>{" "}
                {progress.currentVacancy.title}
              </p>
            )}
          </div>
        )}

        {/* Результаты */}
        {isCompleted && result && (
          <div className="flex gap-4 p-4 rounded-lg border bg-muted/50">
            {result.imported > 0 && (
              <div className="flex-1 text-center space-y-1">
                <p className="text-2xl font-bold text-green-600">
                  {result.imported}
                </p>
                <p className="text-xs text-muted-foreground">Новых</p>
              </div>
            )}
            {result.updated > 0 && (
              <div className="flex-1 text-center space-y-1">
                <p className="text-2xl font-bold text-blue-600">
                  {result.updated}
                </p>
                <p className="text-xs text-muted-foreground">Обновлено</p>
              </div>
            )}
            {result.failed > 0 && (
              <div className="flex-1 text-center space-y-1">
                <p className="text-2xl font-bold text-destructive">
                  {result.failed}
                </p>
                <p className="text-xs text-muted-foreground">Ошибок</p>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {isCompleted && (
        <CardFooter>
          <Button onClick={onComplete} className="w-full">
            Закрыть
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
