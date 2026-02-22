"use client";

import { Badge } from "@qbs-autonaim/ui/components/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import { cn } from "@qbs-autonaim/ui/utils";
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
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4">
        {Array.from({ length: 4 }, (_, index) => `skeleton-${index}`).map(
          (key) => (
            <Card key={key} className="animate-pulse">
              <CardHeader>
                <CardDescription>Загрузка...</CardDescription>
                <CardTitle className="text-3xl font-semibold">—</CardTitle>
              </CardHeader>
            </Card>
          ),
        )}
      </div>
    );
  }

  const pendingResponses = stats.totalResponses - stats.processedResponses;
  const hasNewResponses = stats.newResponses > 0;
  const hasPendingResponses = pendingResponses > 0;

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4">
      <Card>
        <CardHeader>
          <CardDescription>Новые отклики</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {stats.newResponses}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className={cn(
                hasNewResponses
                  ? "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400"
                  : "border-muted-foreground/50 bg-muted/10 text-muted-foreground",
              )}
            >
              {hasNewResponses ? (
                <IconTrendingUp className="size-4" />
              ) : (
                <IconTrendingDown className="size-4" />
              )}
              {hasNewResponses ? "Есть новые" : "Нет новых"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="text-sm text-muted-foreground">
          за последние 24 часа
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Ожидают обработки</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {pendingResponses}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className={cn(
                hasPendingResponses
                  ? "border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-400"
                  : "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400",
              )}
            >
              {hasPendingResponses ? "Требуют внимания" : "Все обработаны"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="text-sm text-muted-foreground">
          из {stats.totalResponses} всего
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Подходящие кандидаты</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {stats.highScoreResponses}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="border-primary/50 bg-primary/10 text-primary"
            >
              Оценка ≥ 3.0
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="text-sm text-muted-foreground">
          готовы к интервью
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Активные вакансии</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {stats.totalVacancies}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-muted-foreground/50">
              В работе
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="text-sm text-muted-foreground">
          открытых позиций
        </CardFooter>
      </Card>
    </div>
  );
}
