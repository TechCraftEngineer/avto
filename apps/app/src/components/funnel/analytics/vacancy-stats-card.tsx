"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import { Briefcase } from "lucide-react";
import type { VacancyStat } from "./types";

interface VacancyStatsCardProps {
  vacancyStats: VacancyStat[] | undefined;
  isError?: boolean;
  errorMessage?: string;
}

export function VacancyStatsCard({
  vacancyStats,
  isError,
  errorMessage,
}: VacancyStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          Статистика по вакансиям
        </CardTitle>
        <CardDescription>Кандидаты по открытым позициям</CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <div className="text-center py-8">
            <Briefcase className="h-12 w-12 mx-auto mb-3 text-red-300" />
            <p className="text-sm text-red-600">Ошибка загрузки данных</p>
            {errorMessage && (
              <p className="text-xs text-muted-foreground mt-1">
                {errorMessage}
              </p>
            )}
          </div>
        ) : !vacancyStats || vacancyStats.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Нет данных по вакансиям</p>
          </div>
        ) : (
          <div className="space-y-4">
            {vacancyStats.map((vacancy) => (
              <div
                key={vacancy.vacancyId}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="space-y-1 flex-1">
                  <h4 className="font-semibold">{vacancy.vacancyName}</h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Всего: {vacancy.total}</span>
                    <span>•</span>
                    <span>В работе: {vacancy.inProcess}</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-medium">
                      Наняты: {vacancy.hired}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {vacancy.total > 0
                      ? ((vacancy.hired / vacancy.total) * 100).toFixed(0)
                      : 0}
                    %
                  </div>
                  <div className="text-xs text-muted-foreground">конверсия</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
