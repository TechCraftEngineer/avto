"use client";

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  ScrollArea,
} from "@qbs-autonaim/ui";
import { IconCheck, IconClock, IconLoader2, IconX } from "@tabler/icons-react";
import { useEffect, useRef } from "react";
import { useScreenBatchProgress } from "~/hooks/use-screen-batch-progress";

interface BatchScreeningProgressProps {
  workspaceId: string;
  batchId: string;
  onComplete?: () => void;
}

/**
 * Компонент для отображения realtime прогресса batch оценки откликов
 * Показывает детальный прогресс по каждому кандидату
 */
export function BatchScreeningProgress({
  workspaceId,
  batchId,
  onComplete,
}: BatchScreeningProgressProps) {
  const { scoredResponses, progress, completed, isProcessing } =
    useScreenBatchProgress(workspaceId, batchId);

  const prevCompletedRef = useRef(false);

  useEffect(() => {
    if (completed !== null && onComplete && !prevCompletedRef.current) {
      onComplete();
    }
    prevCompletedRef.current = completed !== null;
  }, [completed, onComplete]);

  const progressPercent = progress
    ? Math.round((progress.processed / progress.total) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Оценка откликов</CardTitle>
            <CardDescription>
              {completed
                ? `Завершено за ${completed.duration} сек.`
                : isProcessing
                  ? "Идёт обработка..."
                  : "Ожидание запуска"}
            </CardDescription>
          </div>
          {isProcessing && (
            <IconLoader2 className="size-5 animate-spin text-primary" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Общий прогресс */}
        {progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Обработано {progress.processed} из {progress.total}
              </span>
              <span className="font-medium">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            {progress.currentCandidate && (
              <p className="text-xs text-muted-foreground">
                Сейчас: {progress.currentCandidate}
              </p>
            )}
          </div>
        )}

        {/* Итоговая статистика */}
        {completed && (
          <div className="flex gap-4 rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <IconCheck className="size-4 text-green-600" />
              <span className="text-sm">
                Успешно: <strong>{completed.processed}</strong>
              </span>
            </div>
            {completed.failed > 0 && (
              <div className="flex items-center gap-2">
                <IconX className="size-4 text-red-600" />
                <span className="text-sm">
                  Ошибок: <strong>{completed.failed}</strong>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Список обработанных откликов */}
        {scoredResponses.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Результаты оценки</h4>
            <ScrollArea className="h-[300px] rounded-md border">
              <div className="space-y-2 p-4">
                {scoredResponses.map((response) => (
                  <div
                    key={response.responseId}
                    className="flex items-center justify-between rounded-lg border bg-card p-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      {response.status === "processing" && (
                        <IconClock className="size-4 text-muted-foreground" />
                      )}
                      {response.status === "completed" && (
                        <IconCheck className="size-4 text-green-600" />
                      )}
                      {response.status === "failed" && (
                        <IconX className="size-4 text-red-600" />
                      )}
                      <span className="font-medium">
                        {response.candidateName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {response.status === "completed" && (
                        <Badge
                          variant={
                            response.score >= 70
                              ? "default"
                              : response.score >= 40
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {response.score} баллов
                        </Badge>
                      )}
                      {response.status === "failed" && (
                        <span className="text-xs text-red-600">
                          {response.error || "Ошибка"}
                        </span>
                      )}
                      {response.status === "processing" && (
                        <span className="text-xs text-muted-foreground">
                          Обработка...
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
