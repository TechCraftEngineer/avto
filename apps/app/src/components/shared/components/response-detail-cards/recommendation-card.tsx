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
import { ArrowRight, Lightbulb } from "lucide-react";
import { memo } from "react";
import { getRecommendationConfig } from "~/lib/recommendation-config";
import { ItemsListSection } from "~/components/ui/items-list";
import type { CandidateRecommendation } from "~/types/screening";

interface RecommendationCardProps {
  recommendation: CandidateRecommendation;
}

/**
 * Recommendation Card Component
 * Displays candidate recommendation with strengths, weaknesses, risks, and action suggestions
 */
export const RecommendationCard = memo(function RecommendationCard({
  recommendation,
}: RecommendationCardProps) {
  const config = getRecommendationConfig(recommendation.recommendation);
  const Icon = config.icon;

  const hasStrengths = recommendation.strengths.length > 0;
  const hasWeaknesses =
    recommendation.weaknesses && recommendation.weaknesses.length > 0;
  const hasRisks =
    recommendation.riskFactors && recommendation.riskFactors.length > 0;
  const hasQuestions =
    recommendation.interviewQuestions &&
    recommendation.interviewQuestions.length > 0;
  const hasActions =
    recommendation.actionSuggestions &&
    recommendation.actionSuggestions.length > 0;

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
        {/* Strengths - Using reusable ItemsListSection */}
        {hasStrengths && (
          <>
            <ItemsListSection
              items={recommendation.strengths}
              type="strengths"
              icon={true}
            />
            <Separator />
          </>
        )}

        {/* Weaknesses - Using reusable ItemsListSection */}
        {hasWeaknesses && (
          <>
            <ItemsListSection
              items={recommendation.weaknesses ?? []}
              type="weaknesses"
              icon={true}
            />
            <Separator />
          </>
        )}

        {/* Risk Factors */}
        {hasRisks && (
          <>
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                <span className="text-red-600 dark:text-red-400">⚠</span>
                Факторы риска
              </h4>
              <ul className="space-y-1.5 sm:space-y-2">
                {recommendation.riskFactors?.map((risk) => (
                  <li
                    key={`risk-${risk.description.slice(0, 20)}`}
                    className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground"
                  >
                    <span className="text-red-600 dark:text-red-400 shrink-0 mt-0.5">
                      •
                    </span>
                    <span className="wrap-break-word">{risk.description}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Separator />
          </>
        )}

        {/* Interview Questions - Using reusable ItemsListSection */}
        {hasQuestions && (
          <>
            <ItemsListSection
              items={recommendation.interviewQuestions ?? []}
              type="questions"
              icon={true}
            />
            <Separator />
          </>
        )}

        {/* Action Suggestions */}
        {hasActions && (
          <div className="space-y-2">
            <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
              Рекомендуемые действия
            </h4>
            <ol className="space-y-1.5 sm:space-y-2">
              {recommendation.actionSuggestions?.map((action, index) => (
                <li
                  key={`action-${index}-${action.slice(0, 20)}`}
                  className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground"
                >
                  <span className="font-medium text-primary shrink-0">
                    {index + 1}.
                  </span>
                  <span className="wrap-break-word">{action}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default RecommendationCard;
