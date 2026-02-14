"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@qbs-autonaim/ui";
import {
  Clock,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import type { AnalyticsData } from "./types";

interface StatusStatsCardsProps {
  analytics: AnalyticsData | undefined;
}

export function StatusStatsCards({ analytics }: StatusStatsCardsProps) {
  const statusStats = [
    {
      label: "Всего кандидатов",
      count: analytics?.totalCandidates ?? 0,
      icon: Users,
      trend: `+${analytics?.newThisWeek ?? 0}`,
      trendUp: true,
      description: "за эту неделю",
    },
    {
      label: "В процессе",
      count:
        (analytics?.byStage.NEW ?? 0) +
        (analytics?.byStage.REVIEW ?? 0) +
        (analytics?.byStage.INTERVIEW ?? 0),
      icon: Clock,
      trendUp: true,
      description: "активные кандидаты",
    },
    {
      label: "Наняты",
      count: analytics?.hired ?? 0,
      icon: UserCheck,
      trendUp: true,
      description: "успешно наняты",
    },
    {
      label: "Отклонены",
      count: analytics?.byStage.REJECTED ?? 0,
      icon: UserX,
      trendUp: false,
      description: "не прошли отбор",
    },
  ];

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
      {statusStats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">
              {stat.label}
            </CardTitle>
            <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
            <div className="text-xl sm:text-2xl font-bold tabular-nums">
              {stat.count}
            </div>
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground mt-1">
              {stat.trend && (
                <>
                  {stat.trendUp ? (
                    <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-500 shrink-0" />
                  ) : (
                    <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-500 shrink-0" />
                  )}
                  <span
                    className={
                      stat.trendUp ? "text-emerald-500" : "text-red-500"
                    }
                  >
                    {stat.trend}
                  </span>
                </>
              )}
              <span className="truncate">{stat.description}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
