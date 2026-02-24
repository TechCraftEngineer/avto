"use client";

import { Badge } from "@qbs-autonaim/ui/components/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import { Skeleton } from "@qbs-autonaim/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  Inbox,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useWorkspace } from "~/hooks/use-workspace";
import { useORPC } from "~/orpc/react";

export function DashboardStats() {
  const orpc = useORPC();
  const { workspace } = useWorkspace();

  const { data: stats, isLoading } = useQuery(
    orpc.vacancy.dashboardStats.queryOptions({
      input: {
        workspaceId: workspace?.id ?? "",
      },
      enabled: !!workspace?.id,
    }),
  );

  if (isLoading || !stats) {
    const skeletonKeys = ["new", "pending", "candidates", "vacancies"] as const;
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {skeletonKeys.map((key) => (
          <Card key={key}>
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <Skeleton className="size-4 rounded" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-9 w-16" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  const pendingResponses = stats.totalResponses - stats.processedResponses;
  const hasNewResponses = stats.newResponses > 0;
  const hasPendingResponses = pendingResponses > 0;

  const cards = [
    {
      icon: hasNewResponses ? TrendingUp : TrendingDown,
      description: "Новые отклики",
      value: stats.newResponses,
      badge: (
        <Badge variant={hasNewResponses ? "success" : "secondary"}>
          {hasNewResponses ? (
            <TrendingUp className="size-3.5" />
          ) : (
            <TrendingDown className="size-3.5" />
          )}
          {hasNewResponses ? "Есть новые" : "Нет новых"}
        </Badge>
      ),
      footer: "за последние 24 часа",
    },
    {
      icon: Inbox,
      description: "Ожидают обработки",
      value: pendingResponses,
      badge: (
        <Badge variant={hasPendingResponses ? "warning" : "success"}>
          {hasPendingResponses ? "Требуют внимания" : "Все обработаны"}
        </Badge>
      ),
      footer: `из ${stats.totalResponses} всего`,
    },
    {
      icon: Sparkles,
      description: "Подходящие кандидаты",
      value: stats.highScoreResponses,
      badge: <Badge variant="default">Оценка ≥ 3.0</Badge>,
      footer: "готовы к интервью",
    },
    {
      icon: Briefcase,
      description: "Активные вакансии",
      value: stats.totalVacancies,
      badge: <Badge variant="outline">В работе</Badge>,
      footer: "открытых позиций",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map(({ icon: Icon, description, value, badge, footer }) => (
        <Card key={description} className="@container/card">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground" />
                <CardDescription>{description}</CardDescription>
              </div>
              <CardTitle className="text-2xl font-semibold tabular-nums">
                {value}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{footer}</p>
            </div>
            {badge}
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
