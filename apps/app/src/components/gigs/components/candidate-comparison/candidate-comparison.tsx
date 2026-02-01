"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  ScrollArea,
  Separator,
} from "@qbs-autonaim/ui";
import {
  AlertCircle,
  Award,
  Banknote,
  CheckCircle2,
  Clock,
  TrendingUp,
  User,
  X,
} from "lucide-react";

type RankedCandidate =
  RouterOutputs["gig"]["responses"]["ranked"]["candidates"][number];

interface CandidateComparisonProps {
  candidates: RankedCandidate[];
  onClose?: () => void;
}

const SCORE_CATEGORIES = [
  { key: "compositeScore", label: "Общая оценка", icon: Award },
  { key: "priceScore", label: "Цена", icon: Banknote },
  { key: "deliveryScore", label: "Срок", icon: Clock },
  { key: "skillsMatchScore", label: "Навыки", icon: Award },
  { key: "experienceScore", label: "Опыт", icon: TrendingUp },
] as const;

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
  if (!amount) return "—";
  return `${amount.toLocaleString("ru-RU")} ₽`;
}

export function CandidateComparison({
  candidates,
  onClose,
}: CandidateComparisonProps) {
  if (candidates.length === 0) {
    return null;
  }

  // Limit to 3 candidates for comparison
  const comparisonCandidates = candidates.slice(0, 3);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Сравнение кандидатов
            </CardTitle>
            <CardDescription>
              Детальное сравнение до {comparisonCandidates.length} кандидатов
            </CardDescription>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="w-full">
          <div className="min-w-[800px]">
            {/* Candidate Headers */}
            <div
              className="grid gap-4 mb-6"
              style={{
                gridTemplateColumns: `200px repeat(${comparisonCandidates.length}, 1fr)`,
              }}
            >
              <div /> {/* Empty cell for labels */}
              {comparisonCandidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-muted/50"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-sm truncate max-w-[200px]">
                      {candidate.candidateName || candidate.candidateId}
                    </h3>
                    {candidate.rankingPosition && (
                      <p className="text-xs text-muted-foreground">
                        Позиция #{candidate.rankingPosition}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Score Comparisons */}
            <div className="space-y-6">
              {SCORE_CATEGORIES.map((category) => {
                const Icon = category.icon;
                const hasAnyScore = comparisonCandidates.some(
                  (c) => c[category.key] !== null,
                );

                if (!hasAnyScore) return null;

                // Find the highest score for highlighting
                const scores = comparisonCandidates
                  .map((c) => c[category.key])
                  .filter((s): s is number => s !== null);
                const maxScore = scores.length > 0 ? Math.max(...scores) : 0;

                return (
                  <div key={category.key}>
                    <div
                      className="grid gap-4"
                      style={{
                        gridTemplateColumns: `200px repeat(${comparisonCandidates.length}, 1fr)`,
                      }}
                    >
                      {/* Category Label */}
                      <div className="flex items-center gap-2 py-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {category.label}
                        </span>
                      </div>

                      {/* Scores */}
                      {comparisonCandidates.map((candidate) => {
                        const score = candidate[category.key];
                        const isHighest = score === maxScore && score !== null;

                        return (
                          <div
                            key={candidate.id}
                            className={`p-3 rounded-lg border ${
                              isHighest
                                ? "bg-primary/5 border-primary/20"
                                : "bg-background"
                            }`}
                          >
                            {score !== null ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span
                                    className={`text-lg font-bold ${getScoreColor(score)}`}
                                  >
                                    {score}
                                  </span>
                                  {isHighest && (
                                    <Badge
                                      variant="default"
                                      className="text-xs"
                                    >
                                      Лучший
                                    </Badge>
                                  )}
                                </div>
                                <Progress
                                  value={score}
                                  className="h-1.5"
                                  indicatorClassName={getProgressColor(score)}
                                />
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                —
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator className="my-6" />

            {/* Additional Details */}
            <div className="space-y-6">
              {/* Price Comparison */}
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `200px repeat(${comparisonCandidates.length}, 1fr)`,
                }}
              >
                <div className="flex items-center gap-2 py-2">
                  <Banknote className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Предложенная цена</span>
                </div>
                {comparisonCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="p-3 rounded-lg border bg-background"
                  >
                    <span className="text-sm font-medium">
                      {formatCurrency(candidate.proposedPrice)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Delivery Time Comparison */}
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `200px repeat(${comparisonCandidates.length}, 1fr)`,
                }}
              >
                <div className="flex items-center gap-2 py-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Срок выполнения</span>
                </div>
                {comparisonCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="p-3 rounded-lg border bg-background"
                  >
                    <span className="text-sm font-medium">
                      {candidate.proposedDeliveryDays
                        ? `${candidate.proposedDeliveryDays} ${candidate.proposedDeliveryDays === 1 ? "день" : candidate.proposedDeliveryDays < 5 ? "дня" : "дней"}`
                        : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Strengths and Weaknesses */}
            <div className="space-y-6">
              {/* Strengths */}
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `200px repeat(${comparisonCandidates.length}, 1fr)`,
                }}
              >
                <div className="flex items-center gap-2 py-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium">Преимущества</span>
                </div>
                {comparisonCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="p-3 rounded-lg border bg-background"
                  >
                    {candidate.strengths && candidate.strengths.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.strengths.map((strength) => (
                          <Badge
                            key={strength}
                            variant="secondary"
                            className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
                          >
                            {strength}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Не указано
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Weaknesses */}
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `200px repeat(${comparisonCandidates.length}, 1fr)`,
                }}
              >
                <div className="flex items-center gap-2 py-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm font-medium">Недостатки</span>
                </div>
                {comparisonCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="p-3 rounded-lg border bg-background"
                  >
                    {candidate.weaknesses && candidate.weaknesses.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.weaknesses.map((weakness) => (
                          <Badge
                            key={weakness}
                            variant="outline"
                            className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800"
                          >
                            {weakness}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Не указано
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
