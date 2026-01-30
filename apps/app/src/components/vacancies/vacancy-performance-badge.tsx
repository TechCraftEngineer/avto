"use client";

import { Badge } from "@qbs-autonaim/ui";
import {
  IconMinus,
  IconTrendingDown,
  IconTrendingUp,
} from "@tabler/icons-react";

interface VacancyPerformanceBadgeProps {
  views: number | null;
  responses: number | null;
  className?: string;
}

/**
 * Компонент для отображения эффективности вакансии
 * Показывает конверсию просмотров в отклики с цветовой индикацией
 */
export function VacancyPerformanceBadge({
  views,
  responses,
  className,
}: VacancyPerformanceBadgeProps) {
  if (!views || views === 0 || !responses) {
    return null;
  }

  const conversionRate = (responses / views) * 100;

  // Определяем уровень эффективности
  // Хорошая конверсия: > 5%
  // Средняя конверсия: 2-5%
  // Низкая конверсия: < 2%
  const getPerformanceLevel = () => {
    if (conversionRate >= 5) {
      return {
        label: "Отличная",
        color: "bg-green-100 text-green-700 border-green-200",
        icon: IconTrendingUp,
      };
    }
    if (conversionRate >= 2) {
      return {
        label: "Средняя",
        color: "bg-yellow-100 text-yellow-700 border-yellow-200",
        icon: IconMinus,
      };
    }
    return {
      label: "Низкая",
      color: "bg-red-100 text-red-700 border-red-200",
      icon: IconTrendingDown,
    };
  };

  const performance = getPerformanceLevel();
  const Icon = performance.icon;

  return (
    <Badge
      variant="outline"
      className={`gap-1 font-medium ${performance.color} ${className}`}
      title={`Конверсия: ${conversionRate.toFixed(1)}% (${responses} откликов из ${views} просмотров)`}
    >
      <Icon className="size-3" />
      {conversionRate.toFixed(1)}%
    </Badge>
  );
}
