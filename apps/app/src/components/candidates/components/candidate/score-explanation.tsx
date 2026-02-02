"use client";

import { Card, CardContent, CardHeader } from "@qbs-autonaim/ui/card";
import { Progress } from "@qbs-autonaim/ui/progress";
import { AlertCircle, Info } from "lucide-react";

interface ScoreExplanationProps {
  /** Название критерия */
  label: string;
  /** Оценка (0-100) */
  score: number | null;
  /** Объяснение оценки */
  reasoning: string | null;
  /** Иконка для критерия */
  icon?: React.ReactNode;
  /** Показывать ли предупреждение если reasoning отсутствует */
  showMissingWarning?: boolean;
}

function getScoreColor(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-blue-600 dark:text-blue-400";
  if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function getProgressColor(score: number | null): string {
  if (score === null) return "bg-muted";
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-blue-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

export function ScoreExplanation({
  label,
  score,
  reasoning,
  icon,
  showMissingWarning = true,
}: ScoreExplanationProps) {
  const hasReasoning = reasoning && reasoning.trim().length > 0;
  const hasScore = score !== null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {icon && <div className="text-muted-foreground">{icon}</div>}
          <h3 className="text-sm font-semibold">{label}</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Score Display */}
        {hasScore ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Оценка</span>
              <span className={`text-lg font-bold ${getScoreColor(score)}`}>
                {score}/100
              </span>
            </div>
            <Progress
              value={score}
              className="h-2"
              indicatorClassName={getProgressColor(score)}
            />
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Оценка недоступна</div>
        )}

        {/* Reasoning */}
        {hasReasoning ? (
          <div className="rounded-lg border-l-4 border-primary/50 bg-muted/30 p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <p className="text-sm leading-relaxed text-foreground">
                {reasoning}
              </p>
            </div>
          </div>
        ) : showMissingWarning ? (
          <div className="rounded-lg border-l-4 border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Объяснение будет доступно после пересчета оценки
              </p>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
