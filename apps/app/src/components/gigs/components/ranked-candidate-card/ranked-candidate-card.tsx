"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Progress,
} from "@qbs-autonaim/ui";
import {
  AlertCircle,
  Award,
  Banknote,
  CheckCircle2,
  Clock,
  MessageSquare,
  Star,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";

type RankedCandidate =
  RouterOutputs["gig"]["responses"]["ranked"]["candidates"][number];

interface RankedCandidateCardProps {
  candidate: RankedCandidate;
  orgSlug: string;
  workspaceSlug: string;
  gigId: string;
  onAccept?: (responseId: string) => void;
  onReject?: (responseId: string) => void;
  onMessage?: (responseId: string) => void;
  showRank?: boolean;
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

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-blue-600 dark:text-blue-400";
  if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function getProgressColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-blue-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

function formatCurrency(amount: number | null) {
  if (!amount) return null;
  return `${amount.toLocaleString("ru-RU")} ₽`;
}

export function RankedCandidateCard({
  candidate,
  orgSlug,
  workspaceSlug,
  gigId,
  onAccept,
  onReject,
  onMessage,
  showRank = true,
}: RankedCandidateCardProps) {
  const recommendationConfig = candidate.recommendation
    ? RECOMMENDATION_CONFIG[candidate.recommendation]
    : null;
  const RecommendationIcon = recommendationConfig?.icon;

  const isTopThree =
    candidate.rankingPosition && candidate.rankingPosition <= 3;

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  return (
    <Link
      href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/responses/${candidate.id}`}
    >
      <Card
        className={`hover:shadow-lg transition-all duration-200 cursor-pointer group ${
          isTopThree ? "ring-2 ring-primary/20" : ""
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Ranking Position Badge */}
              {showRank && candidate.rankingPosition && (
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full shrink-0 font-bold text-lg ${
                    isTopThree
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  #{candidate.rankingPosition}
                </div>
              )}

              {!showRank && (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0 group-hover:bg-primary/20 transition-colors">
                  <User className="h-6 w-6 text-primary" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-base truncate">
                    {candidate.candidateName || candidate.candidateId}
                  </h3>

                  {candidate.rating && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">
                        {candidate.rating}
                      </span>
                    </div>
                  )}
                </div>

                {/* Composite Score */}
                {candidate.compositeScore !== null && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Общая оценка:</span>
                    <span
                      className={`font-bold ${getScoreColor(candidate.compositeScore)}`}
                    >
                      {candidate.compositeScore}/100
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Recommendation Badge */}
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

        <CardContent className="space-y-3">
          {/* Composite Score Progress Bar */}
          {candidate.compositeScore !== null && (
            <div className="space-y-1.5">
              <Progress
                value={candidate.compositeScore}
                className="h-2"
                indicatorClassName={getProgressColor(candidate.compositeScore)}
              />
            </div>
          )}

          {/* Score Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {candidate.priceScore !== null && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 p-2 rounded-lg border bg-background hover:bg-muted transition-colors text-left"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Banknote className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-muted-foreground">Цена</div>
                      <div className="font-medium">{candidate.priceScore}</div>
                    </div>
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80" align="start">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Оценка цены</h4>
                    {candidate.proposedPrice && (
                      <p className="text-xs font-medium">
                        Предложенная цена:{" "}
                        {formatCurrency(candidate.proposedPrice)}
                      </p>
                    )}
                    {candidate.priceScoreReasoning ? (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {candidate.priceScoreReasoning}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Объяснение будет доступно после пересчета оценки
                      </p>
                    )}
                  </div>
                </HoverCardContent>
              </HoverCard>
            )}

            {candidate.deliveryScore !== null && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 p-2 rounded-lg border bg-background hover:bg-muted transition-colors text-left"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-muted-foreground">Срок</div>
                      <div className="font-medium">
                        {candidate.deliveryScore}
                      </div>
                    </div>
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80" align="start">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Оценка сроков</h4>
                    {candidate.proposedDeliveryDays && (
                      <p className="text-xs font-medium">
                        Предложенный срок: {candidate.proposedDeliveryDays}{" "}
                        {candidate.proposedDeliveryDays === 1
                          ? "день"
                          : candidate.proposedDeliveryDays < 5
                            ? "дня"
                            : "дней"}
                      </p>
                    )}
                    {candidate.deliveryScoreReasoning ? (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {candidate.deliveryScoreReasoning}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Объяснение будет доступно после пересчета оценки
                      </p>
                    )}
                  </div>
                </HoverCardContent>
              </HoverCard>
            )}

            {candidate.skillsMatchScore !== null && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 p-2 rounded-lg border bg-background hover:bg-muted transition-colors text-left"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Award className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-muted-foreground">Навыки</div>
                      <div className="font-medium">
                        {candidate.skillsMatchScore}
                      </div>
                    </div>
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80" align="start">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">
                      Соответствие навыков
                    </h4>
                    {candidate.skillsMatchScoreReasoning ? (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {candidate.skillsMatchScoreReasoning}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Объяснение будет доступно после пересчета оценки
                      </p>
                    )}
                  </div>
                </HoverCardContent>
              </HoverCard>
            )}

            {candidate.experienceScore !== null && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 p-2 rounded-lg border bg-background hover:bg-muted transition-colors text-left"
                    onClick={(e) => e.preventDefault()}
                  >
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-muted-foreground">Опыт</div>
                      <div className="font-medium">
                        {candidate.experienceScore}
                      </div>
                    </div>
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80" align="start">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Оценка опыта</h4>
                    {candidate.experienceScoreReasoning ? (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {candidate.experienceScoreReasoning}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Объяснение будет доступно после пересчета оценки
                      </p>
                    )}
                  </div>
                </HoverCardContent>
              </HoverCard>
            )}
          </div>

          {/* Strengths and Weaknesses */}
          {(candidate.strengths?.length || candidate.weaknesses?.length) && (
            <div className="space-y-2">
              {candidate.strengths && candidate.strengths.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {candidate.strengths.map((strength) => (
                    <Badge
                      key={strength}
                      variant="secondary"
                      className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {strength}
                    </Badge>
                  ))}
                </div>
              )}

              {candidate.weaknesses && candidate.weaknesses.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {candidate.weaknesses.map((weakness) => (
                    <Badge
                      key={weakness}
                      variant="outline"
                      className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800"
                    >
                      <AlertCircle className="h-3 w-3" />
                      {weakness}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Composite Score Reasoning Preview */}
          {candidate.compositeScoreReasoning && (
            <div className="p-3 rounded-lg border-l-4 border-primary/50 bg-muted/30">
              <h4 className="text-xs font-semibold mb-1">
                Почему подходит / почему нет
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                {candidate.compositeScoreReasoning}
              </p>
            </div>
          )}

          {/* Ranking Analysis Preview */}
          {candidate.rankingAnalysis && (
            <div className="p-3 rounded-lg border bg-muted/50">
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {candidate.rankingAnalysis}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t">
            {onAccept && (
              <Button
                size="sm"
                variant="default"
                className="gap-1.5 min-h-[44px] sm:min-h-[36px] touch-manipulation"
                onClick={(e) => handleAction(e, () => onAccept(candidate.id))}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Принять
              </Button>
            )}

            {onMessage && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 min-h-[44px] sm:min-h-[36px] touch-manipulation"
                onClick={(e) => handleAction(e, () => onMessage(candidate.id))}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Написать
              </Button>
            )}

            {onReject && (
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 ml-auto min-h-[44px] sm:min-h-[36px] touch-manipulation"
                onClick={(e) => handleAction(e, () => onReject(candidate.id))}
              >
                <XCircle className="h-3.5 w-3.5" />
                Отклонить
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
