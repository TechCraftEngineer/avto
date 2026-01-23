"use client";

import { useInngestSubscription } from "@inngest/realtime/hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Progress,
} from "@qbs-autonaim/ui";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchScreenNewResponsesToken } from "~/actions/realtime";

interface ScreeningProgressDialogProps {
  vacancyId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ScreeningProgressDialog({
  vacancyId,
  isOpen,
  onClose,
}: ScreeningProgressDialogProps) {
  const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(
    null,
  );

  // Подписываемся на канал Realtime
  const { data, error } = useInngestSubscription({
    refreshToken: () => fetchScreenNewResponsesToken(vacancyId),
    enabled: isOpen,
  });

  // Получаем последнее сообщение
  const latestMessage = data[data.length - 1];
  const isCompleted = latestMessage?.topic === "result";
  const progressData =
    latestMessage?.topic === "progress" ? latestMessage.data : null;
  const resultData =
    latestMessage?.topic === "result" ? latestMessage.data : null;

  // Вычисляем прогресс
  const progress = progressData?.total
    ? Math.round(((progressData.processed || 0) / progressData.total) * 100)
    : 0;

  // Автоматически закрываем диалог через 3 секунды после завершения
  useEffect(() => {
    if (isCompleted && resultData) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      setAutoCloseTimer(timer);
    }

    return () => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
    };
  }, [isCompleted, resultData, onClose, autoCloseTimer]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCompleted ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Оценка завершена
              </>
            ) : (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Оценка новых откликов
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isCompleted
              ? "Все отклики успешно обработаны"
              : "Отслеживание прогресса обработки откликов в реальном времени"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <span>Ошибка подключения к серверу</span>
            </div>
          )}

          {!progressData && !resultData && !error && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Подключение...</span>
            </div>
          )}

          {progressData && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {progressData.message}
                  </span>
                  {progressData.total && (
                    <span className="font-medium">
                      {progressData.processed || 0} / {progressData.total}
                    </span>
                  )}
                </div>

                {progressData.total && progressData.total > 0 && (
                  <Progress value={progress} className="h-2" />
                )}
              </div>

              {progressData.status === "processing" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Обработка откликов...</span>
                </div>
              )}
            </>
          )}

          {resultData && (
            <div className="space-y-4 rounded-lg border bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {resultData.total}
                  </div>
                  <div className="text-xs text-muted-foreground">Всего</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {resultData.processed}
                  </div>
                  <div className="text-xs text-muted-foreground">Успешно</div>
                </div>
                {resultData.failed > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-destructive">
                      {resultData.failed}
                    </div>
                    <div className="text-xs text-muted-foreground">Ошибок</div>
                  </div>
                )}
              </div>

              {resultData.total > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Успешность:</span>
                    <span className="font-medium text-green-600">
                      {Math.round(
                        (resultData.processed / resultData.total) * 100,
                      )}
                      %
                    </span>
                  </div>
                </div>
              )}

              <p className="text-xs text-center text-muted-foreground pt-2">
                Закроется автоматически через 3 секунды
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
