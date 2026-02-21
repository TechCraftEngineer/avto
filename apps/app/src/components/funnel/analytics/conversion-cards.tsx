"use client";

import { Badge } from "@qbs-autonaim/ui/components/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qbs-autonaim/ui/components/card";
import { Activity, Award, Clock, UserCheck, Users, UserX } from "lucide-react";
import type { AnalyticsData, FunnelStageData } from "./types";

interface ConversionCardsProps {
  stages: FunnelStageData[];
  analytics: AnalyticsData | undefined;
  overallConversion: string;
}

export function ConversionCards({
  stages,
  analytics,
  overallConversion,
}: ConversionCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Статистика по этапам
          </CardTitle>
          <CardDescription>Распределение кандидатов</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stages.map((stage) => (
            <div
              key={stage.name}
              className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-8 rounded-full ${stage.color}`} />
                <span className="font-medium text-sm">{stage.name}</span>
              </div>
              <Badge variant="secondary">{stage.count} кандидатов</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Ключевые метрики
          </CardTitle>
          <CardDescription>Показатели эффективности</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              <Award className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Общая конверсия</span>
            </div>
            <Badge variant="secondary">{overallConversion}%</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Новых за неделю</span>
            </div>
            <Badge variant="secondary">{analytics?.newThisWeek ?? 0}</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              <UserCheck className="h-4 w-4 text-emerald-500" />
              <span className="font-medium text-sm">Успешно наняты</span>
            </div>
            <Badge className="bg-emerald-500">{analytics?.hired ?? 0}</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              <UserX className="h-4 w-4 text-red-500" />
              <span className="font-medium text-sm">Отклонено</span>
            </div>
            <Badge variant="destructive">
              {analytics?.byStage.REJECTED ?? 0}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
