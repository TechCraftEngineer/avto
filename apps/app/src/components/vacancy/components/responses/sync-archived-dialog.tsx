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
} from "@qbs-autonaim/ui";
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Loader2,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { fetchSyncArchivedVacancyResponsesToken } from "~/actions/realtime";

interface SyncArchivedDialogProps {
  vacancyId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SyncArchivedDialog({
  vacancyId,
  isOpen,
  onClose,
  onConfirm,
}: SyncArchivedDialogProps) {
  const [isStarted, setIsStarted] = useState(false);
  const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(
    null,
  );

  // Подписываемся на канал Realtime
  const { data, error } = useInngestSubscription({
    refreshToken: () => fetchSyncArchivedVacancyResponsesToken(vacancyId),
    enabled: isOpen && isStarted,
  });

  // Получаем последнее сообщение
  const latestMessage = data[data.length - 1];
  const statusData = latestMessage?.data;

  const isCompleted = statusData?.status === "completed";
  const hasError = statusData?.status === "error" || !!error;

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
    if (isCompleted && statusData) {
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);
      setAutoCloseTimer(timer);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [isCompleted, statusData, handleClose]);

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
                <Archive className="h-5 w-5 text-blue-600" />
                Синхронизация архивных откликов
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Синхронизация завершена
              </>
            ) : hasError ? (
              <>
                <XCircle className="h-5 w-5 text-destructive" />
                Ошибка синхронизации
              </>
            ) : (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                Синхронизация в процессе
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {!isStarted
              ? "Получение всех откликов с HeadHunter, включая архивные"
              : isCompleted
                ? "Все архивные отклики успешно синхронизированы"
                : hasError
                  ? "Произошла ошибка при синхронизации"
                  : "Отслеживание прогресса синхронизации в реальном времени"}
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
                    <li>Получение всех откликов с HeadHunter</li>
                    <li>Включая архивные и удаленные отклики</li>
                    <li>Процесс может занять несколько минут</li>
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

              {!statusData && !error && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Подключение к серверу...</span>
                </div>
              )}

              {statusData && (
                <>
                  {statusData.status === "started" && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {statusData.message}
                      </p>
                    </div>
                  )}

                  {statusData.status === "processing" && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {statusData.message}
                      </p>

                      {(statusData.syncedResponses !== undefined ||
                        statusData.newResponses !== undefined) && (
                        <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-foreground">
                                {statusData.syncedResponses || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Обработано
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {statusData.newResponses || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Новых добавлено
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="rounded-lg border bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground text-center">
                          Получаем данные с HeadHunter…
                          <br />
                          Это может занять несколько минут
                        </p>
                      </div>
                    </div>
                  )}

                  {statusData.status === "completed" && (
                    <div className="space-y-4 rounded-lg border bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-4">
                      {statusData.vacancyTitle && (
                        <div className="pb-2 border-b">
                          <p className="text-sm font-medium text-foreground">
                            {statusData.vacancyTitle}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-foreground">
                            {statusData.syncedResponses || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Всего обработано
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {statusData.newResponses || 0}
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
                  )}

                  {statusData.status === "error" && (
                    <div className="space-y-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                      <div className="flex items-center gap-2 text-destructive">
                        <XCircle className="h-5 w-5 shrink-0" />
                        <span className="font-medium">
                          Не удалось синхронизировать
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {statusData.message}
                      </p>
                    </div>
                  )}
                </>
              )}
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
                <Archive className="h-4 w-4 mr-2" />
                Начать синхронизацию
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
