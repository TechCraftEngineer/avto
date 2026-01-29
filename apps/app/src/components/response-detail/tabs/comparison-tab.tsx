"use client";

import { Badge, Progress, ScrollArea } from "@qbs-autonaim/ui";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Award, TrendingDown, Users } from "lucide-react";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

interface ComparisonTabProps {
  responseId: string;
  vacancyId: string;
  currentScore?: number | null;
}

export function ComparisonTab({
  responseId,
  vacancyId,
  currentScore,
}: ComparisonTabProps) {
  const { workspace } = useWorkspace();
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.vacancy.responses.compare.queryOptions({
      vacancyId,
      workspaceId: workspace.id,
      limit: 10,
    }),
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={`skeleton-${index}-${Date.now()}`}
            className="p-4 border rounded-lg animate-pulse"
          >
            <div className="h-4 bg-muted rounded w-1/3 mb-2" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.responses.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 text-center py-12 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Недостаточно данных для сравнения</p>
      </div>
    );
  }

  const currentPosition =
    data.responses.findIndex((r) => r.id === responseId) + 1;
  const currentResponseData = data.responses.find((r) => r.id === responseId);

  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-6">
        {/* Статистика */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-lg border bg-card">
            <div className="text-xs text-muted-foreground mb-1">
              Позиция в рейтинге
            </div>
            <div className="text-2xl font-bold">
              {currentPosition > 0 ? `#${currentPosition}` : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              из {data.stats.totalCount}
            </div>
          </div>

          <div className="p-4 rounded-lg border bg-card">
            <div className="text-xs text-muted-foreground mb-1">Ваш балл</div>
            <div className="text-2xl font-bold">
              {currentScore ?? currentResponseData?.compositeScore ?? "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">из 100</div>
          </div>

          <div className="p-4 rounded-lg border bg-card">
            <div className="text-xs text-muted-foreground mb-1">
              Средний балл
            </div>
            <div className="text-2xl font-bold">
              {data.stats.avgScore?.toFixed(1) ?? "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {currentScore && data.stats.avgScore
                ? currentScore > data.stats.avgScore
                  ? "выше среднего"
                  : "ниже среднего"
                : ""}
            </div>
          </div>

          <div className="p-4 rounded-lg border bg-card">
            <div className="text-xs text-muted-foreground mb-1">
              Лучший балл
            </div>
            <div className="text-2xl font-bold">
              {data.stats.maxScore?.toFixed(1) ?? "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {currentScore && data.stats.maxScore
                ? `${((currentScore / data.stats.maxScore) * 100).toFixed(0)}% от лучшего`
                : ""}
            </div>
          </div>
        </div>

        {/* Топ кандидатов */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Award className="h-4 w-4" />
            Топ-{data.responses.length} кандидатов
          </h3>

          <div className="space-y-3">
            {data.responses.map((response, index) => {
              const isCurrentResponse = response.id === responseId;
              const score = response.compositeScore ?? 0;

              return (
                <div
                  key={response.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    isCurrentResponse
                      ? "bg-primary/5 border-primary"
                      : "bg-card hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
                          index === 0
                            ? "bg-yellow-500/20 text-yellow-600"
                            : index === 1
                              ? "bg-gray-400/20 text-gray-600"
                              : index === 2
                                ? "bg-orange-500/20 text-orange-600"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <span className="text-sm font-bold">#{index + 1}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {response.candidateName || "Без имени"}
                          {isCurrentResponse && (
                            <Badge variant="outline" className="ml-2">
                              Вы
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(response.createdAt), {
                            addSuffix: true,
                            locale: ru,
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold">{score}</div>
                      <div className="text-xs text-muted-foreground">балл</div>
                    </div>
                  </div>

                  {/* Прогресс бар */}
                  <Progress value={score} className="h-2 mb-3" />

                  {/* Детальные оценки */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {response.skillsMatchScore !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Навыки:</span>
                        <span className="font-medium">
                          {response.skillsMatchScore}
                        </span>
                      </div>
                    )}
                    {response.experienceScore !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Опыт:</span>
                        <span className="font-medium">
                          {response.experienceScore}
                        </span>
                      </div>
                    )}
                    {response.salaryExpectationsAmount && (
                      <div className="flex items-center justify-between col-span-2">
                        <span className="text-muted-foreground">Зарплата:</span>
                        <span className="font-medium">
                          {response.salaryExpectationsAmount.toLocaleString()} ₽
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Статусы */}
                  <div className="flex gap-2 mt-3">
                    {response.status && (
                      <Badge variant="secondary" className="text-xs">
                        {response.status}
                      </Badge>
                    )}
                    {response.hrSelectionStatus && (
                      <Badge variant="outline" className="text-xs">
                        {response.hrSelectionStatus}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Сравнение с лидером */}
        {currentPosition > 1 && data.responses[0] && currentResponseData && (
          <div className="p-4 rounded-lg border bg-muted/50">
            <h4 className="text-sm font-semibold mb-3">Сравнение с лидером</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Разница в баллах:
                </span>
                <span className="text-sm font-medium flex items-center gap-1">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  {(
                    (data.responses[0].compositeScore ?? 0) -
                    (currentResponseData.compositeScore ?? 0)
                  ).toFixed(1)}
                </span>
              </div>
              {currentResponseData.skillsMatchScore !== null &&
                data.responses[0].skillsMatchScore !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Навыки:
                    </span>
                    <span className="text-sm font-medium">
                      {data.responses[0].skillsMatchScore -
                        currentResponseData.skillsMatchScore >
                      0 ? (
                        <span className="text-destructive">
                          -
                          {data.responses[0].skillsMatchScore -
                            currentResponseData.skillsMatchScore}
                        </span>
                      ) : (
                        <span className="text-green-600">
                          +
                          {currentResponseData.skillsMatchScore -
                            data.responses[0].skillsMatchScore}
                        </span>
                      )}
                    </span>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
