"use client";

import { InngestSubscriptionState, useInngestSubscription } from "@bunworks/inngest-realtime/hooks";
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
import { CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";
import { useCallback, useState } from "react";
import { fetchImportNewGigsToken } from "~/actions/gig-import";

interface ImportNewGigsProgressProps {
  workspaceId: string;
  onComplete: () => void;
}

/**
 * Ошибки подключения/токена (до получения result) считаются повторяемыми.
 * Только result topic или неизвестные ошибки после result — терминальные.
 */
function isTransientError(
  error: Error | null,
  latestTopic: string | undefined,
  state: InngestSubscriptionState,
): boolean {
  if (!error) return false;
  if (latestTopic === "result") return false;
  return (
    state === InngestSubscriptionState.Error ||
    state === InngestSubscriptionState.RefreshingToken
  );
}

export function ImportNewGigsProgress({
  workspaceId,
  onComplete,
}: ImportNewGigsProgressProps) {
  const [retryKey, setRetryKey] = useState(0);

  const { data, error, state } = useInngestSubscription({
    refreshToken: () => fetchImportNewGigsToken(workspaceId),
    enabled: true,
    key: String(retryKey),
  });

  const latestMessage = data[data.length - 1];
  const hasTerminalResult = latestMessage?.topic === "result";
  const hasTransientError = isTransientError(
    error,
    latestMessage?.topic,
    state,
  );
  const isCompleted =
    hasTerminalResult || (Boolean(error) && !hasTransientError);

  const handleRetry = useCallback(() => {
    setRetryKey((k) => k + 1);
  }, []);
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

  const getStatusMessage = () => {
    if (error) return "Ошибка подключения к серверу";
    if (!progressData && !resultData) return "Подключение...";
    if (progressData) return progressData.message;

    if (resultData) {
      if (resultData.success) {
        const total = resultData.imported + resultData.updated;
        if (total === 0) return "Активных проектов не найдено";

        const parts: string[] = [];
        if (resultData.imported > 0) parts.push(`${resultData.imported} новых`);
        if (resultData.updated > 0)
          parts.push(`${resultData.updated} обновлено`);
        return `Загружено: ${parts.join(", ")}`;
      }
      return resultData.error || "Не удалось импортировать проекты";
    }

    return "";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          {resultData?.success ? (
            <CheckCircle2 className="size-6 text-green-600" />
          ) : error ? (
            <XCircle className="size-6 text-destructive" />
          ) : (
            <Loader2 className="size-6 animate-spin text-primary" />
          )}
          <div className="flex-1">
            <CardTitle>
              {resultData?.success
                ? "Импорт завершён"
                : error
                  ? hasTransientError
                    ? "Ошибка подключения"
                    : "Ошибка импорта"
                  : "Импорт активных проектов"}
            </CardTitle>
            <CardDescription>{getStatusMessage()}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
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

        {isCompleted &&
          resultData &&
          (resultData.imported > 0 ||
            resultData.updated > 0 ||
            resultData.failed > 0) && (
            <>
              <Separator />
              <div className="flex flex-wrap gap-4 rounded-lg border bg-muted/50 p-4">
                {resultData.imported > 0 && (
                  <div className="min-w-[100px] flex-1 space-y-1 text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {resultData.imported}
                    </p>
                    <p className="text-xs text-muted-foreground">Новых</p>
                  </div>
                )}
                {resultData.updated > 0 && (
                  <div className="min-w-[100px] flex-1 space-y-1 text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {resultData.updated}
                    </p>
                    <p className="text-xs text-muted-foreground">Обновлено</p>
                  </div>
                )}
                {resultData.failed > 0 && (
                  <div className="min-w-[100px] flex-1 space-y-1 text-center">
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

      {(isCompleted || hasTransientError) && (
        <CardFooter className="flex flex-wrap gap-2">
          {hasTransientError && (
            <Button onClick={handleRetry} variant="default">
              <RefreshCw className="mr-2 size-4" />
              Повторить
            </Button>
          )}
          <Button
            onClick={onComplete}
            variant={hasTransientError ? "outline" : "default"}
            className="flex-1"
          >
            Закрыть
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
