"use client";

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
} from "@qbs-autonaim/ui";
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Lightbulb,
  Star,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import type { RecommendationData } from "../utils/types";

interface RecommendationCardProps {
  recommendation: RecommendationData;
}

interface RecommendationConfig {
  variant: "default" | "secondary" | "destructive";
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

function getRecommendationConfig(
  level: RecommendationData["recommendation"],
): RecommendationConfig {
  const configs: Record<
    RecommendationData["recommendation"],
    RecommendationConfig
  > = {
    HIGHLY_RECOMMENDED: {
      variant: "default",
      color: "text-green-600 dark:text-green-400",
      icon: Star,
      label: "Настоятельно рекомендуется",
    },
    RECOMMENDED: {
      variant: "default",
      color: "text-blue-600 dark:text-blue-400",
      icon: ThumbsUp,
      label: "Рекомендуется",
    },
    NEUTRAL: {
      variant: "secondary",
      color: "text-yellow-600 dark:text-yellow-400",
      icon: AlertCircle,
      label: "Нейтрально",
    },
    NOT_RECOMMENDED: {
      variant: "destructive",
      color: "text-red-600 dark:text-red-400",
      icon: XCircle,
      label: "Не рекомендуется",
    },
  };

  return configs[level];
}

export function RecommendationCard({
  recommendation,
}: RecommendationCardProps) {
  const config = getRecommendationConfig(recommendation.recommendation);
  const Icon = config.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
            Рекомендация по кандидату
          </CardTitle>
          <Badge variant={config.variant} className="shrink-0">
            <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
            {config.label}
          </Badge>
        </div>
        <CardDescription className="text-xs sm:text-sm mt-2">
          {recommendation.candidateSummary}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-5">
        {/* Сильные стороны */}
        {recommendation.strengths.length > 0 && (
          <>
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400 shrink-0" />
                Сильные стороны
              </h4>
              <ul className="space-y-1.5 sm:space-y-2">
                {recommendation.strengths.map((strength) => (
                  <li
                    key={strength}
                    className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground"
                  >
                    <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    <span className="break-words">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Separator />
          </>
        )}

        {/* Слабые стороны */}
        {recommendation.weaknesses.length > 0 && (
          <>
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
                Слабые стороны
              </h4>
              <ul className="space-y-1.5 sm:space-y-2">
                {recommendation.weaknesses.map((weakness) => (
                  <li
                    key={weakness}
                    className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                    <span className="break-words">{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Separator />
          </>
        )}

        {/* Факторы риска */}
        {recommendation.riskFactors &&
          recommendation.riskFactors.length > 0 && (
            <>
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <AlertOctagon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 dark:text-red-400 shrink-0" />
                  Факторы риска
                </h4>
                <ul className="space-y-1.5 sm:space-y-2">
                  {recommendation.riskFactors.map((risk) => (
                    <li
                      key={risk}
                      className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground"
                    >
                      <AlertOctagon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <span className="break-words">{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Separator />
            </>
          )}

        {/* Вопросы для интервью */}
        {recommendation.interviewQuestions &&
          recommendation.interviewQuestions.length > 0 && (
            <>
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                  Вопросы для интервью
                </h4>
                <ul className="space-y-1.5 sm:space-y-2">
                  {recommendation.interviewQuestions.map((question) => (
                    <li
                      key={question}
                      className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground"
                    >
                      <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0 mt-0.5" />
                      <span className="break-words">{question}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Separator />
            </>
          )}

        {/* Рекомендуемые действия */}
        <div className="space-y-2">
          <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
            Рекомендуемые действия
          </h4>
          <ol className="space-y-1.5 sm:space-y-2">
            {recommendation.actionSuggestions.map((action) => (
              <li
                key={action}
                className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground"
              >
                <span className="shrink-0 font-medium text-primary">
                  {recommendation.actionSuggestions.indexOf(action) + 1}.
                </span>
                <span className="break-words">{action}</span>
              </li>
            ))}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
