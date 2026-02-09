"use client";

import { useInngestSubscription } from "@qbs-autonaim/inngest-realtime/hooks";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Progress,
  Separator,
} from "@qbs-autonaim/ui";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { fetchImportNewVacanciesToken } from "~/actions/vacancy-import";

interface ImportNewProgressProps {
  workspaceId: string;
  onComplete: () => void;
}

export function ImportNewProgress({
  workspaceId,
  onComplete,
}: ImportNewProgressProps) {
  const completedRef = useRef(false);

  const { data, error } = useInngestSubscription({
    refreshToken: () => fetchImportNewVacanciesToken(workspaceId),
    enabled: true,
  });

  const latestMessage = data[data.length - 1];
  const isCompleted = latestMessage?.topic === "result";
  const progressData =
    latestMessage?.topic === "progress" ? latestMessage.data : null;
  const resultData =
    latestMessage?.topic === "result" ? latestMessage.data : null;

  const progressTotal = progressData?.total;
  const progressProcessed = progressData?.processed;
  const progress =
    progressTotal && progressTotal > 0
      ? Math.round(((progressProcessed || 0) / progressTotal) * 100)
      : 0;

  useEffect(() => {
    if (completedRef.current) return;

    if (isCompleted || error) {
      completedRef.current = true;
    }
  }, [isCompleted, error]);

  const getStatusMessage = () => {
    if (error) return "Ошибка подключения к серверу";
    if (!progressData && !resultData) return "Подключение...";
    if (progressData) return progressData.message;

    if (resultData) {
      if (resultData.success) {
        const total = resultData.imported + resultData.updated;
        if (total === 0) return "Новых вакансий не найдено";

        const parts: string[] = [];
        if (resultData.imported > 0) parts.push(`${resultData.imported} новых`);
        if (resultData.updated > 0)
          parts.push(`${resultData.updated} обновлено`);
        return `Загружено: ${parts.join(", ")}`;
      }
      return resultData.error || "Не удалось импортировать вакансии";
    }

    return "";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          {isCompleted ? (
            resultData?.success ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-destructive" />
            )
          ) : (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          )}
          <div className="flex-1">
            <CardTitle>
              {isCompleted
                ? resultData?.success
                  ? "Импорт завершён"
                  : "Ошибка импорта"
                : "Импорт активных вакансий"}
            </CardTitle>
            <CardDescription>{getStatusMessage()}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Прогресс-бар */}
        {progressTotal && progressTotal > 0 && !isCompleted && (
          <div className="space-y-2">
            <Progress value={progress} />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {progressProcessed || 0} / {progressTotal}
              </span>
              <span>{progress}%</span>
            </div>
          </div>
        )}

        {/* Результаты */}
        {isCompleted &&
          resultData &&
          (resultData.imported > 0 ||
            resultData.updated > 0 ||
            resultData.failed > 0) && (
            <>
              <Separator />
              <div className="flex flex-wrap gap-4 p-4 rounded-lg border bg-muted/50">
                {resultData.imported > 0 && (
                  <div className="flex-1 min-w-[100px] text-center space-y-1">
                    <p className="text-2xl font-bold text-green-600">
                      {resultData.imported}
                    </p>
                    <p className="text-xs text-muted-foreground">Новых</p>
                  </div>
                )}
                {resultData.updated > 0 && (
                  <div className="flex-1 min-w-[100px] text-center space-y-1">
                    <p className="text-2xl font-bold text-blue-600">
                      {resultData.updated}
                    </p>
                    <p className="text-xs text-muted-foreground">Обновлено</p>
                  </div>
                )}
                {resultData.failed > 0 && (
                  <div className="flex-1 min-w-[100px] text-center space-y-1">
                    <p className="text-2xl font-bold text-destructive">
                      {resultData.failed}
                    </p>
                    <p className="text-xs text-muted-foreground">Ошибок</p>
                  </div>
                )}
              </div>
            </>
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
