"use client";

import { Card, CardContent } from "@qbs-autonaim/ui";
import type { GigDraft } from "./types";

interface ProgressCardProps {
  draft: GigDraft;
}

export function ProgressCard({ draft }: ProgressCardProps) {
  const progress = [
    draft.type !== "OTHER",
    draft.title,
    draft.description,
    draft.requiredSkills,
    draft.budgetMin,
    draft.estimatedDuration,
  ].filter(Boolean).length;

  const pct = Math.round((progress / 6) * 100);

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Прогресс заполнения</span>
          <span className="font-medium tabular-nums">{pct}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-3 text-xs text-muted-foreground">
          <span className={draft.type !== "OTHER" ? "text-primary" : ""}>
            Тип
          </span>
          <span className={draft.title ? "text-primary" : ""}>Название</span>
          <span className={draft.description ? "text-primary" : ""}>
            Описание
          </span>
          <span className={draft.requiredSkills ? "text-primary" : ""}>
            Навыки
          </span>
          <span className={draft.budgetMin ? "text-primary" : ""}>Бюджет</span>
          <span className={draft.estimatedDuration ? "text-primary" : ""}>
            Сроки
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
