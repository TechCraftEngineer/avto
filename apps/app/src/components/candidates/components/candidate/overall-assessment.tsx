"use client";

import { Badge } from "@qbs-autonaim/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@qbs-autonaim/ui/components/card"
import { Progress } from "@qbs-autonaim/ui/components/progress";
import { memo } from "react";
import { AlertCircle } from "lucide-react";
import {
  cn,
  getScoreTheme,
  getScoreColor,
  getProgressColor,
} from "~/lib/score-utils";
import { getRecommendationConfig } from "~/lib/recommendation-config";
import { ItemsListSection } from "~/components/ui/items-list";
import type { OverallAssessmentData } from "~/types/screening";

interface OverallAssessmentProps extends OverallAssessmentData {}

function getScoreColorValue(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  const theme = getScoreTheme(score);
  return getScoreColor(theme);
}

function getProgressColorValue(score: number | null): string {
  if (score === null) return "bg-muted";
  const theme = getScoreTheme(score);
  return getProgressColor(theme);
}

/**
 * Overall Assessment Component
 * Displays the composite score, recommendation, and strengths/weaknesses summary
 */
export const OverallAssessment = memo(function OverallAssessment({
  compositeScore,
  compositeReasoning,
  recommendation,
  strengths,
  weaknesses,
}: OverallAssessmentProps) {
  const recommendationConfig = recommendation
    ? getRecommendationConfig(recommendation)
    : null;
  const RecommendationIcon = recommendationConfig?.icon;

  const hasStrengths = strengths && strengths.length > 0;
  const hasWeaknesses = weaknesses && weaknesses.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Общая оценка</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Итоговая оценка кандидата с учетом всех факторов
            </p>
          </div>
          {recommendationConfig && RecommendationIcon && (
            <Badge
              variant={recommendationConfig.variant}
              className="gap-1 shrink-0"
            >
              <RecommendationIcon className="h-3 w-3" />
              {recommendationConfig.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Composite Score */}
        {compositeScore !== null ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Итоговая оценка
              </span>
              <span
                className={cn(
                  "text-2xl font-bold",
                  getScoreColorValue(compositeScore),
                )}
              >
                {compositeScore}/100
              </span>
            </div>
            <Progress
              value={compositeScore}
              className="h-3"
              indicatorClassName={getProgressColorValue(compositeScore)}
              role="progressbar"
              aria-valuenow={compositeScore}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Общая оценка кандидата"
            />
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Оценка недоступна</div>
        )}

        {/* Composite Reasoning */}
        {compositeReasoning ? (
          <div className="rounded-lg border-l-4 border-primary/50 bg-muted/30 p-4">
            <h4 className="text-sm font-semibold mb-2">
              Почему подходит / почему нет
            </h4>
            <p className="text-sm leading-relaxed text-foreground">
              {compositeReasoning}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border-l-4 border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Объяснение будет доступно после пересчета оценки
              </p>
            </div>
          </div>
        )}

        {/* Strengths and Weaknesses Summary - Using reusable ItemsListSection */}
        {(hasStrengths || hasWeaknesses) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hasStrengths && (
              <ItemsListSection
                items={strengths ?? []}
                type="strengths"
                icon={true}
              />
            )}

            {hasWeaknesses && (
              <ItemsListSection
                items={weaknesses ?? []}
                type="weaknesses"
                icon={true}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default OverallAssessment;
