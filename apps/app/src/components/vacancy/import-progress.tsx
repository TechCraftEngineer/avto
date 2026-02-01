"use client";

import { useInngestSubscription } from "@inngest/realtime/hooks";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Progress,
  ScrollArea,
} from "@qbs-autonaim/ui";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchImportVacanciesToken } from "~/actions/realtime";

export interface ImportProgressResult {
  success: boolean;
  imported: number;
  updated: number;
  failed: number;
  error?: string;
}

export interface VacancyProgressItem {
  id: string;
  title: string;
  region?: string;
  workLocation?: string;
  archivedAt?: string;
  status: "pending" | "processing" | "success" | "failed";
  error?: string;
}

interface ImportProgressProps {
  type: "new" | "archived" | "by-url";
  workspaceId: string;
  onComplete: (result?: ImportProgressResult) => void;
}

export function ImportProgress({
  type,
  workspaceId,
  onComplete,
}: ImportProgressProps) {
  // Отслеживаем, был ли уже вызван onComplete
  const completedRef = useRef(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);

  // Мемоизируем функцию получения токена, чтобы избежать множественных подключений
  const refreshToken = useCallback(
    () => fetchImportVacanciesToken(workspaceId, type),
    [workspaceId, type],
  );

  // Подписываемся на выполнение функции через Realtime API
  const { data, error, latestData } = useInngestSubscription({
    refreshToken,
    enabled: true,
  });

  // Получаем последнее сообщение
  const latestMessage = latestData ?? data[data.length - 1];
  const isCompleted = latestMessage?.topic === "result";
  const progressData =
    latestMessage?.topic === "progress" ? latestMessage.data : null;
  const resultData: ImportProgressResult | null =
    latestMessage?.topic === "result"
      ? (latestMessage.data as ImportProgressResult)
      : null;

  // Получаем детальный прогресс по вакансиям (если есть)
  const rawVacancyProgress: VacancyProgressItem[] =
    (progressData as { vacancies?: VacancyProgressItem[] })?.vacancies || [];

  // Сортируем вакансии по дате архивации (свежие сначала)
  const vacancyProgress = useMemo(() => {
    const sorted = [...rawVacancyProgress];
    sorted.sort((a, b) => {
      // Если есть даты архивации, сортируем по ним (свежие сначала)
      if (a.archivedAt && b.archivedAt) {
        return (
          new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime()
        );
      }
      // Вакансии с датой идут первыми
      if (a.archivedAt && !b.archivedAt) return -1;
      if (!a.archivedAt && b.archivedAt) return 1;
      // Если дат нет, сохраняем исходный порядок
      return 0;
    });
    return sorted;
  }, [rawVacancyProgress]);

  const currentVacancy = (
    progressData as { currentVacancy?: { id: string; title: string } }
  )?.currentVacancy;

  // Вычисляем прогресс для массового импорта
  const progressTotal = (progressData as { total?: number })?.total;
  const progressProcessed = (progressData as { processed?: number })?.processed;
  const progress =
    progressTotal && progressTotal > 0
      ? Math.round(((progressProcessed || 0) / progressTotal) * 100)
      : 0;

  // Вызываем onComplete при завершении или ошибке только один раз
  useEffect(() => {
    if (completedRef.current) return;

    // Завершение с результатом
    if (isCompleted && resultData) {
      completedRef.current = true;

      // Небольшая задержка для показа финального состояния
      const timer = setTimeout(() => {
        onComplete(resultData);
      }, 1500);

      return () => clearTimeout(timer);
    }

    // Ошибка подключения
    if (error) {
      completedRef.current = true;

      const timer = setTimeout(() => {
        onComplete({
          success: false,
          imported: 0,
          updated: 0,
          failed: 0,
          error: "Ошибка подключения к серверу",
        });
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isCompleted, resultData, error, onComplete]);

  // Получаем заголовок в зависимости от типа
  const getTitle = () => {
    if (isCompleted) {
      return resultData?.success ? "Импорт завершён" : "Ошибка импорта";
    }

    if (type === "new") {
      return "Импорт активных вакансий";
    }
    if (type === "archived") {
      return "Импорт архивных вакансий";
    }
    return "Импорт вакансии по ссылке";
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
      if (resultData.success) {
        const total = resultData.imported + resultData.updated;
        if (total === 0) {
          return "Новых вакансий не найдено";
        }

        const parts: string[] = [];
        if (resultData.imported > 0) {
          parts.push(`${resultData.imported} новых`);
        }
        if (resultData.updated > 0) {
          parts.push(`${resultData.updated} обновлено`);
        }

        return `Загружено: ${parts.join(", ")}`;
      }

      return resultData.error || "Не удалось импортировать вакансии";
    }

    return "";
  };

  return (
    <Alert
      variant={
        error || (resultData && !resultData.success) ? "destructive" : "default"
      }
      className="relative overflow-hidden"
    >
      {/* Анимированный фон для успешного завершения */}
      {isCompleted && resultData?.success && (
        <div className="absolute inset-0 bg-linear-to-r from-green-50 to-emerald-50 animate-in fade-in duration-500" />
      )}

      <div className="relative flex items-start gap-3">
        {isCompleted ? (
          resultData?.success ? (
            <div className="relative">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0 animate-in zoom-in duration-300" />
              <div className="absolute inset-0 animate-ping">
                <CheckCircle2 className="h-5 w-5 text-green-600 opacity-75" />
              </div>
            </div>
          ) : (
            <XCircle className="h-5 w-5 mt-0.5 shrink-0 animate-in zoom-in duration-300" />
          )
        ) : (
          <Loader2 className="h-5 w-5 animate-spin mt-0.5 shrink-0" />
        )}

        <div className="flex-1 space-y-3 overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <AlertTitle className="flex items-center gap-2">
                {getTitle()}
                {isCompleted && resultData?.success && (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700"
                  >
                    Готово
                  </Badge>
                )}
              </AlertTitle>
              <AlertDescription className="mt-1.5 whitespace-pre-wrap wrap-break-word">
                {getStatusMessage()}
              </AlertDescription>
            </div>

            {/* Кнопка сворачивания деталей */}
            {type === "archived" &&
              vacancyProgress.length > 0 &&
              !isCompleted && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                  className="shrink-0"
                >
                  {isDetailsExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Свернуть
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Развернуть
                    </>
                  )}
                </Button>
              )}
          </div>

          {/* Прогресс-бар для массового импорта */}
          {progressTotal && progressTotal > 0 && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {progressProcessed || 0} / {progressTotal}
                </span>
                <span>{progress}%</span>
              </div>

              {/* Текущая обрабатываемая вакансия */}
              {currentVacancy && (
                <div className="text-xs text-muted-foreground pt-1 border-t">
                  <span className="font-medium">Обрабатывается:</span>{" "}
                  {currentVacancy.title}
                </div>
              )}
            </div>
          )}

          {/* Детальный список вакансий для архивного импорта */}
          {type === "archived" &&
            vacancyProgress.length > 0 &&
            !isCompleted &&
            isDetailsExpanded && (
              <div className="space-y-2 pt-2 border-t animate-in slide-in-from-top duration-300">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    Прогресс по вакансиям:
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {
                      vacancyProgress.filter((v) => v.status === "success")
                        .length
                    }{" "}
                    / {vacancyProgress.length} завершено
                  </div>
                </div>
                <ScrollArea className="h-[200px] rounded-md border bg-background/50">
                  <div className="p-3 space-y-2">
                    {vacancyProgress.map((vacancy, index) => (
                      <div
                        key={vacancy.id}
                        className={`flex items-start gap-2 text-sm p-2 rounded transition-all ${
                          vacancy.status === "processing"
                            ? "bg-blue-50 border border-blue-200"
                            : ""
                        }`}
                        style={{
                          animationDelay: `${index * 50}ms`,
                        }}
                      >
                        {vacancy.status === "pending" && (
                          <div className="h-4 w-4 rounded-full border-2 border-muted mt-0.5 shrink-0" />
                        )}
                        {vacancy.status === "processing" && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600 mt-0.5 shrink-0" />
                        )}
                        {vacancy.status === "success" && (
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0 animate-in zoom-in duration-200" />
                        )}
                        {vacancy.status === "failed" && (
                          <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div
                            className={`truncate ${
                              vacancy.status === "processing"
                                ? "font-medium text-blue-900"
                                : ""
                            }`}
                          >
                            {vacancy.title}
                          </div>
                          {(vacancy.workLocation || vacancy.archivedAt) && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              {vacancy.workLocation && (
                                <span>{vacancy.workLocation}</span>
                              )}
                              {vacancy.workLocation && vacancy.archivedAt && (
                                <span>•</span>
                              )}
                              {vacancy.archivedAt && (
                                <span>
                                  Архивирована:{" "}
                                  {new Date(
                                    vacancy.archivedAt,
                                  ).toLocaleDateString("ru-RU", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </span>
                              )}
                            </div>
                          )}
                          {vacancy.error && (
                            <div className="text-xs text-destructive mt-0.5">
                              {vacancy.error}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

          {/* Результаты для массового импорта */}
          {resultData &&
            (resultData.imported > 0 ||
              resultData.updated > 0 ||
              resultData.failed > 0) && (
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
                    <div className="text-xs text-muted-foreground">
                      Обновлено
                    </div>
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
        </div>
      </div>
    </Alert>
  );
}
