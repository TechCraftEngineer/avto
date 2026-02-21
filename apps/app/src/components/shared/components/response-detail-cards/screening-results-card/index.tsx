"use client";

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  InfoTooltip,
  Progress,
  Separator,
} from "@qbs-autonaim/ui";
import {
  AlertCircle,
  CheckCircle,
  Sparkles,
  Star,
  UserCheck,
} from "lucide-react";
import { lazy, Suspense, memo, useMemo } from "react";
import { ScoreDisplay } from "~/components/ui/score-display";
import { ItemsListSection } from "~/components/ui/items-list";
import {
  getScoreTheme,
  getScoreColor,
  getProgressColor,
  cn,
} from "~/lib/score-utils";
import { getRecommendationConfig } from "~/lib/recommendation-config";
import type { ScreeningData, RecommendationLevel } from "~/types/screening";
import { SCREENING_TOOLTIPS } from "./screening-tooltips";

// Lazy load heavy components for performance
const AnalysisSections = lazy(() =>
  import("./analysis-sections").then((module) => ({
    default: module.AnalysisSections,
  })),
);
const PsychometricAnalysis = lazy(() =>
  import("./psychometric-analysis").then((module) => ({
    default: module.PsychometricAnalysis,
  })),
);

// Loading skeleton
function ComponentSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-20 bg-muted rounded-lg" />
      <div className="h-16 bg-muted rounded-lg" />
    </div>
  );
}

interface ScreeningResultsCardProps {
  screening: ScreeningData;
  hasInterviewScoring?: boolean;
}

/**
 * Calculate overall match score from all available data
 */
function calculateOverallScore(screening: ScreeningData): {
  score: number;
  recommendation: RecommendationLevel;
  summary: string[];
  strengths: string[];
  concerns: string[];
} {
  const scores: number[] = [];
  const summary: string[] = [];
  const strengths: string[] = [];
  const concerns: string[] = [];

  // Детальная оценка скрининга
  if (screening.detailedScore != null) {
    scores.push(screening.detailedScore);
    if (screening.detailedScore >= 80) {
      strengths.push("Высокий балл скрининга резюме");
    } else if (screening.detailedScore < 60) {
      concerns.push("Низкий балл скрининга резюме");
    }
  }

  // Потенциал
  if (screening.potentialScore != null) {
    scores.push(screening.potentialScore);
    if (screening.potentialScore >= 80) {
      strengths.push("Высокий потенциал кандидата");
    }
  }

  // Карьерная траектория
  if (screening.careerTrajectoryScore != null) {
    scores.push(screening.careerTrajectoryScore);
    if (
      screening.careerTrajectoryType === "growth" ||
      screening.careerTrajectoryType === "stable"
    ) {
      strengths.push("Положительная карьерная траектория");
    } else if (screening.careerTrajectoryType === "decline") {
      concerns.push("Негативная карьерная траектория");
    }
  }

  // Психологический анализ
  if (screening.psychometricAnalysis) {
    scores.push(screening.psychometricAnalysis.compatibilityScore);
    if (screening.psychometricAnalysis.compatibilityScore >= 80) {
      strengths.push("Высокая совместимость с вакансией");
    } else if (screening.psychometricAnalysis.compatibilityScore < 60) {
      concerns.push("Низкая совместимость с вакансией");
    }
    if (screening.psychometricAnalysis.strengths?.length > 0) {
      strengths.push(...screening.psychometricAnalysis.strengths.slice(0, 2));
    }
    if (screening.psychometricAnalysis.challenges?.length > 0) {
      concerns.push(...screening.psychometricAnalysis.challenges.slice(0, 2));
    }
  }

  // Скрытые индикаторы соответствия
  if (
    screening.hiddenFitIndicators &&
    screening.hiddenFitIndicators.length > 0
  ) {
    strengths.push("Есть скрытые индикаторы соответствия");
  }

  // Рассчитываем средний балл
  const overallScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

  // Определяем рекомендацию
  let recommendation: RecommendationLevel = "NEUTRAL";
  if (overallScore >= 80 && concerns.length === 0) {
    recommendation = "HIGHLY_RECOMMENDED";
  } else if (overallScore >= 70) {
    recommendation = "RECOMMENDED";
  } else if (overallScore >= 50) {
    recommendation = "NEUTRAL";
  } else {
    recommendation = "NOT_RECOMMENDED";
  }

  // Формируем сводку
  if (strengths.length > 0) {
    summary.push(`Преимущества: ${strengths.slice(0, 3).join(", ")}`);
  }
  if (concerns.length > 0) {
    summary.push(`Точки роста: ${concerns.slice(0, 3).join(", ")}`);
  }
  if (summary.length === 0) {
    summary.push("Для полной оценки требуется больше данных");
  }

  return { score: overallScore, recommendation, summary, strengths, concerns };
}

/**
 * Screening Results Card - Main container component
 * Displays comprehensive screening analysis with scores and detailed sections
 */
export const ScreeningResultsCard = memo(function ScreeningResultsCard({
  screening,
  hasInterviewScoring = false,
}: ScreeningResultsCardProps) {
  const hasPsychometricAnalysis = !!screening.psychometricAnalysis;
  const hasHiddenFitIndicators =
    screening.hiddenFitIndicators && screening.hiddenFitIndicators.length > 0;

  // Рассчитываем общую оценку
  const overallAssessment = useMemo(
    () => calculateOverallScore(screening),
    [screening],
  );
  const hasInterviewData = hasInterviewScoring || hasPsychometricAnalysis;

  // Собираем вопросы для интервью из разных источников
  const getInterviewQuestions = (): string[] | null => {
    if (
      screening.interviewQuestions &&
      screening.interviewQuestions.length > 0
    ) {
      return screening.interviewQuestions;
    }
    if (
      screening.psychometricAnalysis?.recommendations &&
      screening.psychometricAnalysis.recommendations.length > 0
    ) {
      return screening.psychometricAnalysis.recommendations;
    }
    return null;
  };
  const interviewQuestions = getInterviewQuestions();
  const hasInterviewQuestions =
    interviewQuestions !== null && interviewQuestions.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <span className="text-primary">★</span>
          Результаты скрининга
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Мы отбираем тех, кто реально справится с задачей, а не тех, кто
          красиво написал резюме
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Итоговая оценка - объединенный анализ */}
        <div className="p-4 rounded-lg border-2 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              <span className="font-semibold flex items-center gap-1">
                Итоговая оценка
                <InfoTooltip content={SCREENING_TOOLTIPS.overallScore} />
              </span>
              {!hasInterviewData && (
                <Badge variant="outline" className="text-xs ml-2">
                  Только скрининг
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-2xl font-bold",
                  getScoreColor(getScoreTheme(overallAssessment.score)),
                )}
              >
                {overallAssessment.score}/100
              </span>
            </div>
          </div>

          <Progress
            value={overallAssessment.score}
            className="h-2 mb-3"
            indicatorClassName={getProgressColor(
              getScoreTheme(overallAssessment.score),
            )}
          />

          <div className="flex items-center gap-2 mb-3">
            {(() => {
              const config = getRecommendationConfig(
                overallAssessment.recommendation,
              );
              const Icon = config.icon;
              return (
                <Badge variant={config.variant} className="gap-1">
                  <Icon className="h-3 w-3" />
                  {config.label}
                </Badge>
              );
            })()}
          </div>

          {/* Сводка */}
          {overallAssessment.summary.length > 0 && (
            <div className="space-y-2">
              {/* eslint-disable-next-line @biomejs/biome/no-array-index-key */}
              {overallAssessment.summary.map((item, idx) => (
                <div
                  key={`summary-${item.slice(0, 30)}-${idx}`}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  {idx === 0 && overallAssessment.strengths.length > 0 ? (
                    <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  ) : idx === overallAssessment.strengths.length &&
                    overallAssessment.concerns.length > 0 ? (
                    <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  )}
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Score Overview */}
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          <ScoreDisplay
            score={screening.score}
            maxScore={5}
            label={
              <span className="flex items-center gap-1">
                Общая оценка
                <InfoTooltip content={SCREENING_TOOLTIPS.generalScore} />
              </span>
            }
            size="md"
          />
          <ScoreDisplay
            score={screening.detailedScore}
            maxScore={100}
            label={
              <span className="flex items-center gap-1">
                Детальная оценка
                <InfoTooltip content={SCREENING_TOOLTIPS.detailedScore} />
              </span>
            }
            size="md"
          />
          {screening.potentialScore != null &&
            screening.potentialScore !== undefined && (
              <ScoreDisplay
                score={screening.potentialScore}
                maxScore={100}
                label={
                  <span className="flex items-center gap-1">
                    Потенциал
                    <InfoTooltip content={SCREENING_TOOLTIPS.potentialScore} />
                  </span>
                }
                size="md"
              />
            )}
          {screening.careerTrajectoryScore != null &&
            screening.careerTrajectoryScore !== undefined && (
              <ScoreDisplay
                score={screening.careerTrajectoryScore}
                maxScore={100}
                label={
                  <span className="flex items-center gap-1">
                    Карьерная траектория
                    <InfoTooltip
                      content={SCREENING_TOOLTIPS.careerTrajectory}
                    />
                  </span>
                }
                size="md"
              />
            )}
        </div>

        {/* Career Trajectory Badge */}
        {screening.careerTrajectoryType && (
          <div className="mt-1">
            <Badge variant="outline" className="text-xs">
              {screening.careerTrajectoryType}
            </Badge>
          </div>
        )}

        {/* Hidden Fit Indicator */}
        {hasHiddenFitIndicators && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <UserCheck className="h-3 w-3" />
              Скрытый подходящий
            </Badge>
          </div>
        )}

        <Separator />

        {/* Analysis Sections - Lazy loaded for performance */}
        <Suspense fallback={<ComponentSkeleton />}>
          <AnalysisSections
            analysis={screening.analysis}
            priceAnalysis={screening.priceAnalysis}
            deliveryAnalysis={screening.deliveryAnalysis}
            potentialAnalysis={screening.potentialAnalysis}
            careerTrajectoryAnalysis={screening.careerTrajectoryAnalysis}
            hiddenFitAnalysis={screening.hiddenFitAnalysis}
            hiddenFitIndicators={screening.hiddenFitIndicators}
          />
        </Suspense>

        {/* Questions for Interview - Show separately if psychometric analysis is not available */}
        {hasInterviewQuestions && !hasPsychometricAnalysis && (
          <>
            <Separator />
            <ItemsListSection
              items={interviewQuestions ?? []}
              type="questions"
              icon={true}
            />
          </>
        )}

        {/* Psychometric Analysis - Lazy loaded */}
        {hasPsychometricAnalysis && (
          <>
            <Separator />
            <Suspense fallback={<ComponentSkeleton />}>
              {/* biome-ignore lint/style/noNonNullAssertion: Проверка выполнена через hasPsychometricAnalysis */}
              <PsychometricAnalysis
                analysis={screening.psychometricAnalysis!}
              />
            </Suspense>
          </>
        )}
      </CardContent>
    </Card>
  );
});

export default ScreeningResultsCard;
