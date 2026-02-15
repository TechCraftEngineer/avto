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
import { UserCheck } from "lucide-react";
import { lazy, Suspense, memo } from "react";
import { ScoreDisplay } from "~/components/ui/score-display";
import { ItemsListSection } from "~/components/ui/items-list";
import type { ScreeningData } from "~/types/screening";

// Lazy load heavy components for performance
const AnalysisSections = lazy(() => import("./analysis-sections").then(module => ({ default: module.AnalysisSections })));
const PsychometricAnalysis = lazy(() => import("./psychometric-analysis").then(module => ({ default: module.PsychometricAnalysis })));

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
}

/**
 * Screening Results Card - Main container component
 * Displays comprehensive screening analysis with scores and detailed sections
 */
export const ScreeningResultsCard = memo(function ScreeningResultsCard({ screening }: ScreeningResultsCardProps) {
  const hasPsychometricAnalysis = !!screening.psychometricAnalysis;
  const hasHiddenFitIndicators = screening.hiddenFitIndicators && screening.hiddenFitIndicators.length > 0;

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
        {/* Score Overview - Using reusable ScoreDisplay components */}
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          <ScoreDisplay
            score={screening.score}
            maxScore={5}
            label="Общая оценка"
            size="md"
          />
          <ScoreDisplay
            score={screening.detailedScore}
            maxScore={100}
            label="Детальная оценка"
            size="md"
          />
          {screening.potentialScore != null && screening.potentialScore !== undefined && (
            <ScoreDisplay
              score={screening.potentialScore}
              maxScore={100}
              label="Потенциал"
              size="md"
            />
          )}
          {screening.careerTrajectoryScore != null && screening.careerTrajectoryScore !== undefined && (
            <ScoreDisplay
              score={screening.careerTrajectoryScore}
              maxScore={100}
              label="Карьерная траектория"
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

        {/* Psychometric Analysis - Lazy loaded */}
        {hasPsychometricAnalysis && (
          <>
            <Separator />
            <Suspense fallback={<ComponentSkeleton />}>
              <PsychometricAnalysis analysis={screening.psychometricAnalysis!} />
            </Suspense>
          </>
        )}
      </CardContent>
    </Card>
  );
});

export default ScreeningResultsCard;
