"use client";

import { Badge } from "@qbs-autonaim/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import { Progress } from "@qbs-autonaim/ui/components/progress";
import { Separator } from "@qbs-autonaim/ui/components/separator";
import { Percent, Target, TrendingUp } from "lucide-react";
import type { FunnelStageData } from "./types";

interface FunnelStagesCardProps {
  stages: FunnelStageData[];
  overallConversion: string;
}

export function FunnelStagesCard({
  stages,
  overallConversion,
}: FunnelStagesCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Воронка найма
            </CardTitle>
            <CardDescription className="mt-1.5">
              Прохождение кандидатов по этапам
            </CardDescription>
          </div>
          <Badge variant="secondary" className="h-7 px-3">
            Конверсия: {overallConversion}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {stages.map((stage, index) => {
            const prevStage = index > 0 ? stages[index - 1] : null;
            const dropOff = prevStage ? prevStage.count - stage.count : 0;
            const conversionFromPrev =
              prevStage && prevStage.count > 0
                ? ((stage.count / prevStage.count) * 100).toFixed(0)
                : null;

            return (
              <div key={stage.name} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-10 rounded-full ${stage.color}`} />
                    <div>
                      <div className="font-semibold">{stage.name}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          {stage.percentage}% от общего
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{stage.count}</div>
                    {conversionFromPrev && (
                      <div className="text-sm text-emerald-600 font-medium flex items-center justify-end gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {conversionFromPrev}% конверсия
                      </div>
                    )}
                  </div>
                </div>
                <Progress value={stage.percentage} className="h-3" />
                {prevStage && dropOff > 0 && (
                  <div className="flex items-center justify-between text-xs pl-5">
                    <span className="text-muted-foreground">
                      Отсев:{" "}
                      <span className="font-medium text-red-600">
                        {dropOff}
                      </span>{" "}
                      кандидатов
                    </span>
                  </div>
                )}
                {index < stages.length - 1 && <Separator className="mt-4" />}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
