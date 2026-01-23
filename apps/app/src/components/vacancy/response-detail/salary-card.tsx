"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@qbs-autonaim/ui";
import { Badge } from "@qbs-autonaim/ui";
import { DollarSign, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { VacancyResponse } from "./types";

interface SalaryCardProps {
  response: VacancyResponse;
  marketRate?: number; // Можно передавать рыночную ставку для сравнения
}

export function SalaryCard({ response, marketRate }: SalaryCardProps) {
  const salary = response.salaryExpectationsAmount;
  const comment = response.salaryExpectationsComment;

  if (!salary) {
    return null;
  }

  const getSalaryComparison = () => {
    if (!marketRate) return null;

    const difference = ((salary - marketRate) / marketRate) * 100;

    if (Math.abs(difference) < 5) {
      return {
        icon: Minus,
        text: "В рынке",
        color: "text-gray-600",
        bgColor: "bg-gray-100",
        borderColor: "border-gray-300",
      };
    }

    if (difference > 0) {
      return {
        icon: TrendingUp,
        text: `+${difference.toFixed(0)}% выше рынка`,
        color: "text-green-600",
        bgColor: "bg-green-100",
        borderColor: "border-green-300",
      };
    }

    return {
      icon: TrendingDown,
      text: `${difference.toFixed(0)}% ниже рынка`,
      color: "text-red-600",
      bgColor: "bg-red-100",
      borderColor: "border-red-300",
    };
  };

  const comparison = getSalaryComparison();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Зарплатные ожидания
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-green-600">
            {salary.toLocaleString("ru-RU")}
          </span>
          <span className="text-lg text-muted-foreground">₽</span>
          {comparison && (
            <Badge
              variant="outline"
              className={`${comparison.bgColor} ${comparison.color} ${comparison.borderColor} ml-2`}
            >
              <comparison.icon className="h-3 w-3 mr-1" />
              {comparison.text}
            </Badge>
          )}
        </div>

        {comment && (
          <div className="p-3 bg-gray-50 rounded-lg border">
            <div className="text-sm font-medium text-gray-700 mb-1">
              Комментарий кандидата
            </div>
            <div className="text-sm text-gray-600">{comment}</div>
          </div>
        )}

        {marketRate && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">
                Рыночная ставка
              </div>
              <div className="text-lg font-semibold">
                {marketRate.toLocaleString("ru-RU")} ₽
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Ожидания</div>
              <div className="text-lg font-semibold text-green-600">
                {salary.toLocaleString("ru-RU")} ₽
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Ожидания указаны кандидатом при отклике на вакансию
        </div>
      </CardContent>
    </Card>
  );
}
