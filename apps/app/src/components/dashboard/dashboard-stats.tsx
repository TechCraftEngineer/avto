"use client";

import {
  Badge,
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cn,
} from "@qbs-autonaim/ui";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

export function DashboardStats() {
  const trpc = useTRPC();
  const { workspace } = useWorkspace();

  const { data: stats, isLoading } = useQuery({
    ...trpc.vacancy.dashboardStats.queryOptions({
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id,
  });

  if (isLoading || !stats) {
    return (
      <div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-4 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card">
          {Array.from({ length: 4 }, (_, index) => `skeleton-${index}`).map(
            (key) => (
              <Card key={key} className="@container/card animate-pulse">
                <CardHeader>
                  <CardDescription>Загрузка...</CardDescription>
                  <CardTitle className="text-2xl font-semibold">—</CardTitle>
                </CardHeader>
              </Card>
            ),
          )}
        </div>
      </div>
    );
  }

  const processedPercentage =
    stats.totalResponses > 0
      ? Math.round((stats.processedResponses / stats.totalResponses) * 100)
      : 0;

  const highScorePercentage =
    stats.processedResponses > 0
      ? Math.round((stats.highScoreResponses / stats.processedResponses) * 100)
      : 0;

  const _topScorePercentage =
    stats.processedResponses > 0
      ? Math.round((stats.topScoreResponses / stats.processedResponses) * 100)
      : 0;

  const isGoodProcessed = processedPercentage >= 50;
  const isGoodHighScore = highScorePercentage >= 30;
  const isGoodAvgScore = stats.avgScore >= 3.0;

  return (
    <div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-4 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Всего откликов</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {stats.totalResponses}
            </CardTitle>
            <CardAction>
              <Badge
                variant="outline"
                className={cn(
                  stats.newResponses > 0
                    ? "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400"
                    : "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
                )}
              >
                {stats.newResponses > 0 ? (
                  <IconTrendingUp className="size-4" />
                ) : (
                  <IconTrendingDown className="size-4" />
                )}
                {stats.newResponses} новых
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground">
              по {stats.totalVacancies} вакансиям
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Обработано</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {stats.processedResponses}
            </CardTitle>
            <CardAction>
              <Badge
                variant="outline"
                className={cn(
                  isGoodProcessed
                    ? "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400"
                    : "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
                )}
              >
                {isGoodProcessed ? (
                  <IconTrendingUp className="size-4" />
                ) : (
                  <IconTrendingDown className="size-4" />
                )}
                {processedPercentage}%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground">
              откликов прошли скрининг
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Качественные кандидаты</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {stats.highScoreResponses}
            </CardTitle>
            <CardAction>
              <Badge
                variant="outline"
                className={cn(
                  isGoodHighScore
                    ? "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400"
                    : "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
                )}
              >
                {isGoodHighScore ? (
                  <IconTrendingUp className="size-4" />
                ) : (
                  <IconTrendingDown className="size-4" />
                )}
                {highScorePercentage}%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground">
              кандидатов со скорингом ≥ 3
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Средний балл</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {stats.processedResponses > 0 ? stats.avgScore.toFixed(1) : "—"}
            </CardTitle>
            <CardAction>
              <Badge
                variant="outline"
                className={cn(
                  isGoodAvgScore
                    ? "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400"
                    : "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
                )}
              >
                {isGoodAvgScore ? (
                  <IconTrendingUp className="size-4" />
                ) : (
                  <IconTrendingDown className="size-4" />
                )}
                {stats.processedResponses > 0 ? "из 5.0" : "—"}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground">общая оценка кандидатов</div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
