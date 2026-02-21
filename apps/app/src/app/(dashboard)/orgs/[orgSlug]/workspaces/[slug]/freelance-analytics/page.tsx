"use client";

import { Badge } from "@qbs-autonaim/ui/components/badge"
import { Button } from "@qbs-autonaim/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qbs-autonaim/ui/components/card";
import {
  IconArrowDown,
  IconArrowUp,
  IconCalendar,
  IconClock,
  IconDownload,
  IconPercentage,
  IconTrendingUp,
} from "@tabler/icons-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "~/components/layout";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

export default function FreelanceAnalyticsPage() {
  const { workspace } = useWorkspace();
  const api = useTRPC();
  const queryClient = useQueryClient();

  const [dateFrom] = useState<string | undefined>(undefined);
  const [dateTo] = useState<string | undefined>(undefined);

  const { data, isLoading } = useQuery({
    ...api.freelancePlatforms.getAnalytics.queryOptions({
      workspaceId: workspace?.id ?? "",
      dateFrom,
      dateTo,
    }),
    enabled: !!workspace?.id,
  });

  const handleExport = async () => {
    if (!workspace?.id) return;

    const result = await queryClient.fetchQuery(
      api.freelancePlatforms.exportAnalytics.queryOptions({
        workspaceId: workspace.id,
        dateFrom,
        dateTo,
      }),
    );

    // Создаем Blob с BOM для корректного отображения кириллицы в Excel
    const bom = "\uFEFF";
    const blob = new Blob([bom + result.csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getPlatformName = (source: string) => {
    const platforms: Record<string, string> = {
      kwork: "Kwork",
      fl: "FL.ru",
      freelance: "Freelance.ru",
      hh: "HeadHunter",
    };
    return platforms[source] || source;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Загрузка…</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const summary = data?.summary ?? {
    avgTimeToShortlistDays: 0,
    overallCompletionRate: 0,
    totalVacancies: 0,
    totalWithShortlist: 0,
  };

  const scoreDistribution = data?.scoreDistribution ?? [];
  const platformComparison = data?.platformComparison ?? [];
  const sourceComparison = data?.sourceComparison ?? [];

  type ScoreDistributionItem = {
    scoreRange: string;
    count: number;
    avgScore: number;
  };

  type PlatformComparisonItem = {
    platform: string;
    totalVacancies: number;
    totalResponses: number;
    completedInterviews: number;
    avgScore: number;
    avgTimeToShortlist: number | null;
    completionRate: number;
  };

  type SourceComparisonItem = {
    sourceType: string;
    totalVacancies: number;
    totalResponses: number;
    completedInterviews: number;
    avgScore: number;
    avgTimeToShortlist: number | null;
    completionRate: number;
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <PageHeader
        title="Аналитика фриланс-платформ"
        description="Детальная статистика и сравнение эффективности платформ"
      >
        <Button
          onClick={handleExport}
          variant="outline"
          className="min-h-[44px] md:min-h-0"
          aria-label="Экспортировать данные аналитики"
        >
          <IconDownload className="size-4 mr-2" aria-hidden="true" />
          Экспорт CSV
        </Button>
      </PageHeader>

      {/* Ключевые метрики */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Среднее время до шортлиста
            </CardTitle>
            <IconClock
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {summary.avgTimeToShortlistDays} дн.
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              От создания до первого кандидата
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Коэффициент завершения
            </CardTitle>
            <IconPercentage
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {summary.overallCompletionRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Завершённых интервью
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Всего вакансий
            </CardTitle>
            <IconCalendar
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {summary.totalVacancies}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">С шортлистом</CardTitle>
            <IconTrendingUp
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {summary.totalWithShortlist}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.totalVacancies > 0
                ? Math.round(
                    (summary.totalWithShortlist / summary.totalVacancies) * 100,
                  )
                : 0}
              % от всех
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Распределение оценок */}
      <Card>
        <CardHeader>
          <CardTitle>Распределение оценок</CardTitle>
          <CardDescription>
            Количество кандидатов по диапазонам оценок
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scoreDistribution.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Нет данных для отображения
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {scoreDistribution.map((item: ScoreDistributionItem) => {
                const maxCount = Math.max(
                  ...scoreDistribution.map(
                    (s: ScoreDistributionItem) => s.count,
                  ),
                );
                const percentage = (item.count / maxCount) * 100;

                return (
                  <div key={item.scoreRange} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.scoreRange}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-muted-foreground"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {item.count} кандидатов
                        </span>
                        <span
                          className="font-medium"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          Ср: {item.avgScore}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                        role="progressbar"
                        aria-valuenow={percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${item.scoreRange}: ${item.count} кандидатов`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Сравнение платформ */}
      <Card>
        <CardHeader>
          <CardTitle>Сравнение фриланс-платформ</CardTitle>
          <CardDescription>Метрики по каждой фриланс-платформе</CardDescription>
        </CardHeader>
        <CardContent>
          {platformComparison.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Нет данных для отображения
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Платформа</th>
                    <th className="text-right p-2 font-medium">Вакансий</th>
                    <th className="text-right p-2 font-medium">Откликов</th>
                    <th className="text-right p-2 font-medium">Интервью</th>
                    <th className="text-right p-2 font-medium">Ср. оценка</th>
                    <th className="text-right p-2 font-medium">Завершение %</th>
                    <th className="text-right p-2 font-medium">
                      Дней до шортлиста
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {platformComparison.map(
                    (platform: PlatformComparisonItem) => (
                      <tr key={platform.platform} className="border-b">
                        <td className="p-2">
                          <Badge variant="outline">
                            {getPlatformName(platform.platform)}
                          </Badge>
                        </td>
                        <td
                          className="text-right p-2"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {platform.totalVacancies}
                        </td>
                        <td
                          className="text-right p-2"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {platform.totalResponses}
                        </td>
                        <td
                          className="text-right p-2"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {platform.completedInterviews}
                        </td>
                        <td
                          className="text-right p-2"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {platform.avgScore || "—"}
                        </td>
                        <td
                          className="text-right p-2"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {platform.completionRate}%
                        </td>
                        <td
                          className="text-right p-2"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {platform.avgTimeToShortlist ?? "—"}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Сравнение фриланс vs HeadHunter */}
      <Card>
        <CardHeader>
          <CardTitle>Фриланс-платформы vs HeadHunter</CardTitle>
          <CardDescription>
            Сравнение эффективности разных источников кандидатов
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sourceComparison.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Нет данных для отображения
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sourceComparison.map((source: SourceComparisonItem) => {
                const otherSource = sourceComparison.find(
                  (s: SourceComparisonItem) =>
                    s.sourceType !== source.sourceType,
                );

                return (
                  <div
                    key={source.sourceType}
                    className="rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-lg">
                        {source.sourceType}
                      </h3>
                      {otherSource && (
                        <div className="flex items-center gap-2 text-sm">
                          {source.avgScore > otherSource.avgScore ? (
                            <>
                              <IconArrowUp
                                className="size-4 text-green-600"
                                aria-hidden="true"
                              />
                              <span className="text-green-600">
                                Выше на{" "}
                                {(
                                  source.avgScore - otherSource.avgScore
                                ).toFixed(1)}
                              </span>
                            </>
                          ) : source.avgScore < otherSource.avgScore ? (
                            <>
                              <IconArrowDown
                                className="size-4 text-red-600"
                                aria-hidden="true"
                              />
                              <span className="text-red-600">
                                Ниже на{" "}
                                {(
                                  otherSource.avgScore - source.avgScore
                                ).toFixed(1)}
                              </span>
                            </>
                          ) : null}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Вакансий
                        </p>
                        <p
                          className="text-lg font-medium"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {source.totalVacancies}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Откликов
                        </p>
                        <p
                          className="text-lg font-medium"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {source.totalResponses}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Интервью
                        </p>
                        <p
                          className="text-lg font-medium"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {source.completedInterviews}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Ср. оценка
                        </p>
                        <p
                          className="text-lg font-medium"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {source.avgScore || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Завершение
                        </p>
                        <p
                          className="text-lg font-medium"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {source.completionRate}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          До шортлиста
                        </p>
                        <p
                          className="text-lg font-medium"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {source.avgTimeToShortlist
                            ? `${source.avgTimeToShortlist} дн.`
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
