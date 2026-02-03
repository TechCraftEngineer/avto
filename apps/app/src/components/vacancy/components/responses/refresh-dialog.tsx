"use client";

import { useInngestSubscription } from "@inngest/realtime/hooks";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Progress,
} from "@qbs-autonaim/ui";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { fetchRefreshVacancyResponsesToken } from "~/actions/realtime";

interface RefreshDialogProps {
  vacancyId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function RefreshDialog({
  vacancyId,
  isOpen,
  onClose,
  onConfirm,
}: RefreshDialogProps) {
  const [isStarted, setIsStarted] = useState(false);
  const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(
    null,
  );

  // Подписываемся на канал Realtime
  const { data, error } = useInngestSubscription({
    refreshToken: () => fetchRefreshVacancyResponsesToken(vacancyId),
    enabled: isOpen && isStarted,
  });

  // Получаем последние сообщения
  const progressMessages = data.filter((msg) => msg.topic === "progress");
  const resultMessages = data.filter((msg) => msg.topic === "result");

  const latestProgress = progressMessages[progressMessages.length - 1]?.data;
  const latestResult = resultMessages[resultMessages.length - 1]?.data;

  const isCompleted = latestResult?.success === true;
  const hasError = latestResult?.success === false || !!error;

  // Обработчик подтверждения
  const handleConfirm = () => {
    setIsStarted(true);
    onConfirm();
  };

  // Обработчик закрытия
  const handleClose = useCallback(() => {
    setIsStarted(false);
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
      setAutoCloseTimer(null);
    }
    onClose();
  }, [autoCloseTimer, onClose]);

  // Автоматически закрываем диалог через 3 секунды после завершения
  useEffect(() => {
    if (isCompleted && latestResult) {
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);
      setAutoCloseTimer(timer);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [isCompleted, latestResult, handleClose]);

  // Сброс состояния при закрытии
  useEffect(() => {
    if (!isOpen) {
      setIsStarted(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {!isStarted ? (
              <>
                <Download className="h-5 w-5 text-blue-600" />
                Получение новых откликов
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Получение завершено
              </>
            ) : hasError ? (
              <>
                <XCircle className="h-5 w-5 text-destructive" />
                Ошибка получения
              </>
            ) : (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                Получение откликов
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {!isStarted
              ? "Получение новых откликов с HeadHunter"
              : isCompleted
                ? "Новые отклики успешно получены"
                : hasError
                  ? "Произошла ошибка при получении откликов"
                  : "Отслеживание прогресса получения в реальном времени"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!isStarted ? (
            <div className="space-y-3 rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-foreground">
                    Что будет происходить:
                  </p>
                  <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                    <li>Получение новых откликов с HeadHunter</li>
                    <li>Процесс выполняется в фоновом режиме</li>
                    <li>Новые отклики появятся в таблице автоматически</li>
                    <li>Вы можете закрыть окно — процесс продолжится</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-center gap-2 text-destructive rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                  <XCircle className="h-5 w-5 shrink-0" />
                  <span className="text-sm">Ошибка подключения к серверу</span>
                </div>
              )}

              {!latestProgress && !latestResult && !error && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Подключение к серверу…</span>
                </div>
              )}

              {latestProgress && (
                <>
                  {latestProgress.status === "started" && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {latestProgress.message}
                      </p>
                    </div>
                  )}

                  {latestProgress.status === "processing" && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {latestProgress.message}
                      </p>

                      {latestProgress.currentPage !== undefined && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Страница {latestProgress.currentPage + 1}
                            </span>
                            <div className="flex gap-3 font-mono text-xs">
                              <span className="text-green-600">
                                Новых: {latestProgress.totalSaved || 0}
                              </span>
                              <span className="text-muted-foreground">
                                Пропущено: {latestProgress.totalSkipped || 0}
                              </span>
                            </div>
                          </div>
                          <Progress value={undefined} className="h-2" />
                        </div>
                      )}
                    </div>
                  )}

                  {latestProgress.status === "error" && (
                    <div className="space-y-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                      <div className="flex items-center gap-2 text-destructive">
                        <XCircle className="h-5 w-5 shrink-0" />
                        <span className="font-medium">
                          Не удалось получить отклики
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {latestProgress.message}
                      </p>
                    </div>
                  )}
                </>
              )}

              {latestResult &&
                (latestResult.success ? (
                  <div className="space-y-4 rounded-lg border bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">
                          {latestResult.totalResponses || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Всего откликов
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {latestResult.newCount || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Новых добавлено
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-center text-muted-foreground pt-2 border-t">
                      Закроется автоматически через 3 секунды
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                    <div className="flex items-center gap-2 text-destructive">
                      <XCircle className="h-5 w-5 shrink-0" />
                      <span className="font-medium">
                        Не удалось получить отклики
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {latestResult.error || "Произошла неизвестная ошибка"}
                    </p>
                  </div>
                ))}
            </>
          )}
        </div>

        <DialogFooter>
          {!isStarted ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Отмена
              </Button>
              <Button onClick={handleConfirm}>
                <Download className="h-4 w-4 mr-2" />
                Получить отклики
              </Button>
            </>
          ) : isCompleted ? (
            <Button onClick={handleClose}>Закрыть</Button>
          ) : hasError ? (
            <Button variant="outline" onClick={handleClose}>
              Закрыть
            </Button>
          ) : (
            <Button variant="outline" onClick={handleClose}>
              Закрыть (процесс продолжится)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
