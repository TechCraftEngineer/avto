"use client";

import { Badge } from "@qbs-autonaim/ui";
import { IconTrendingUp } from "@tabler/icons-react";

interface VacancyPerformanceBadgeProps {
  views?: number | null;
  responses: number | null;
  className?: string;
}

/**
 * Компонент для отображения эффективности вакансии по откликам
 * (views удалены — конверсия больше не показывается)
 */
export function VacancyPerformanceBadge({
  responses,
  className,
}: VacancyPerformanceBadgeProps) {
  if (!responses || responses === 0) {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className={`gap-1 font-medium bg-primary/10 text-primary border-primary/20 ${className}`}
      title={`${responses} откликов`}
    >
      <IconTrendingUp className="size-3" />
      {responses}
    </Badge>
  );
}
