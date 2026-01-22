"use client";

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
} from "@qbs-autonaim/ui";
import { CheckCircle2, AlertCircle, TrendingUp, XCircle } from "lucide-react";

interface OverallAssessmentProps {
  /** Итоговая оценка */
  compositeScore: number | null;
  /** Объяснение итоговой оценки */
  compositeReasoning: string | null;
  /** Рекомендация */
  recommendation?:
    | "HIGHLY_RECOMMENDED"
    | "RECOMMENDED"
    | "NEUTRAL"
    | "NOT_RECOMMENDED"
    | null;
  /** Сильные стороны */
  strengths?: string[];
  /** Слабые стороны */
  weaknesses?: string[];
}

const RECOMMENDATION_CONFIG = {
  HIGHLY_RECOMMENDED: {
    label: "Настоятельно рекомендован",
    variant: "default" as const,
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  RECOMMENDED: {
    label: "Рекомендован",
    variant: "secondary" as const,
    icon: TrendingUp,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  NEUTRAL: {
    label: "Нейтрально",
    variant: "outline" as const,
    icon: AlertCircle,
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-950/30",
  },
  NOT_RECOMMENDED: {
    label: "Не рекомендован",
    variant: "destructive" as const,
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
  },
};

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

export function OverallAssessment({
  compositeScore,
  compositeReasoning,
  recommendation,
  strengths,
  weaknesses,
}: OverallAssessmentProps) {
  const recommendationConfig = recommendation
    ? RECOMMENDATION_CONFIG[recommendation]
    : null;
  const RecommendationIcon = recommendationConfig?.icon;

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
                className={`text-2xl font-bold ${getScoreColor(compositeScore)}`}
              >
                {compositeScore}/100
              </span>
            </div>
            <Progress
              value={compositeScore}
              className="h-3"
              indicatorClassName={getProgressColor(compositeScore)}
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

        {/* Strengths and Weaknesses Summary */}
        {(strengths?.length || weaknesses?.length) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strengths && strengths.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  Сильные стороны
                </h4>
                <ul className="space-y-1">
                  {strengths.map((strength, _index) => (
                    <li
                      key={strength}
                      className="text-sm text-muted-foreground leading-relaxed"
                    >
                      • {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {weaknesses && weaknesses.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  Слабые стороны
                </h4>
                <ul className="space-y-1">
                  {weaknesses.map((weakness, _index) => (
                    <li
                      key={weakness}
                      className="text-sm text-muted-foreground leading-relaxed"
                    >
                      • {weakness}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
