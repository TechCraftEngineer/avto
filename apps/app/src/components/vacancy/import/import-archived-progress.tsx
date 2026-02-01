"use client";

import { useInngestSubscription } from "@inngest/realtime/hooks";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Progress,
  ScrollArea,
  Separator,
} from "@qbs-autonaim/ui";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchImportArchivedVacanciesToken } from "~/actions/vacancy-import";

interface VacancyProgressItem {
  id: string;
  title: string;
  region?: string;
  workLocation?: string;
  archivedAt?: string;
  status: "pending" | "processing" | "success" | "failed";
  error?: string;
}

interface ImportArchivedProgressProps {
  workspaceId: string;
  onComplete: () => void;
}

export function ImportArchivedProgress({
  workspaceId,
  onComplete,
}: ImportArchivedProgressProps) {
  const completedRef = useRef(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);

  const { data, error } = useInngestSubscription({
    refreshToken: () => fetchImportArchivedVacanciesToken(workspaceId),
    enabled: true,
  });

  const latestMessage = data[data.length - 1];
  const isCompleted = latestMessage?.topic === "result";
  const progressData =
    latestMessage?.topic === "progress" ? latestMessage.data : null;
  const resultData =
    latestMessage?.topic === "result" ? latestMessage.data : null;

  const rawVacancyProgress: VacancyProgressItem[] =
    progressData?.vacancies || [];

  const vacancyProgress = useMemo(() => {
    if (!rawVacancyProgress.length) return [];
    const sorted = [...rawVacancyProgress];
    sorted.sort((a, b) => {
      if (a.archivedAt && b.archivedAt) {
        return (
          new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime()
        );
      }
      if (a.archivedAt && !b.archivedAt) return -1;
      if (!a.archivedAt && b.archivedAt) return 1;
      return 0;
    });
    return sorted;
  }, [rawVacancyProgress]);

  const currentVacancy = progressData?.currentVacancy;
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
                : "Импорт архивных вакансий"}
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
            {currentVacancy && (
              <>
                <Separator />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Обрабатывается:</span>{" "}
                  {currentVacancy.title}
                </p>
              </>
            )}
          </div>
        )}

        {/* Детальный список вакансий */}
        {vacancyProgress.length > 0 && !isCompleted && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                Прогресс по вакансиям:{" "}
                <span className="text-muted-foreground">
                  {vacancyProgress.filter((v) => v.status === "success").length}{" "}
                  / {vacancyProgress.length}
                </span>
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
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
            </div>

            {isDetailsExpanded && (
              <ScrollArea className="h-[300px] rounded-md border">
                <div className="p-4 space-y-3">
                  {vacancyProgress.map((vacancy) => (
                    <div
                      key={vacancy.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                    >
                      <div className="mt-0.5">
                        {vacancy.status === "pending" && (
                          <div className="h-5 w-5 rounded-full border-2 border-muted" />
                        )}
                        {vacancy.status === "processing" && (
                          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        )}
                        {vacancy.status === "success" && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                        {vacancy.status === "failed" && (
                          <XCircle className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p
                          className={`text-sm ${
                            vacancy.status === "processing" ? "font-medium" : ""
                          }`}
                        >
                          {vacancy.title}
                        </p>
                        {(vacancy.workLocation || vacancy.archivedAt) && (
                          <p className="text-xs text-muted-foreground">
                            {vacancy.workLocation && (
                              <span>{vacancy.workLocation}</span>
                            )}
                            {vacancy.workLocation && vacancy.archivedAt && (
                              <span className="mx-1">•</span>
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
                          </p>
                        )}
                        {vacancy.error && (
                          <p className="text-xs text-destructive">
                            {vacancy.error}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        {/* Результаты */}
        {isCompleted &&
          resultData &&
          (resultData.imported > 0 ||
            resultData.updated > 0 ||
            resultData.failed > 0) && (
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
