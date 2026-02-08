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
import { Award, UserCheck } from "lucide-react";
import { AnalysisSections } from "./analysis-sections";
import { PsychometricAnalysis } from "./psychometric-analysis";
import { ScoreOverview } from "./score-overview";

interface ScreeningData {
  score: number;
  detailedScore: number;
  analysis: string | null | undefined;
  priceAnalysis?: string | null;
  deliveryAnalysis?: string | null;
  potentialScore?: number | null;
  careerTrajectoryScore?: number | null;
  careerTrajectoryType?:
    | "growth"
    | "stable"
    | "decline"
    | "jump"
    | "role_change"
    | null;
  hiddenFitIndicators?: string[] | null;
  potentialAnalysis?: string | null;
  careerTrajectoryAnalysis?: string | null;
  hiddenFitAnalysis?: string | null;
  psychometricAnalysis?: {
    lifePathNumber: number;
    destinyNumber?: number | null;
    soulUrgeNumber?: number | null;
    compatibilityScore: number;
    roleCompatibility: { score: number; analysis: string };
    companyCompatibility: { score: number; analysis: string };
    teamCompatibility: { score: number; analysis: string };
    strengths: string[];
    challenges: string[];
    recommendations: string[];
    summary: string;
    favorablePeriods?: Array<{ period: string; description: string }>;
  } | null;
}

interface ScreeningResultsCardProps {
  screening: ScreeningData;
}

export function ScreeningResultsCard({ screening }: ScreeningResultsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Award className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
          Результаты скрининга
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Мы отбираем тех, кто реально справится с задачей, а не тех, кто
          красиво написал резюме
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <ScoreOverview
          score={screening.score}
          detailedScore={screening.detailedScore}
          potentialScore={screening.potentialScore}
          careerTrajectoryScore={screening.careerTrajectoryScore}
          careerTrajectoryType={screening.careerTrajectoryType}
        />

        {screening.hiddenFitIndicators &&
          screening.hiddenFitIndicators.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <UserCheck className="h-3 w-3" />
                Скрытый подходящий
              </Badge>
            </div>
          )}

        <Separator />

        <AnalysisSections
          analysis={screening.analysis}
          priceAnalysis={screening.priceAnalysis}
          deliveryAnalysis={screening.deliveryAnalysis}
          potentialAnalysis={screening.potentialAnalysis}
          careerTrajectoryAnalysis={screening.careerTrajectoryAnalysis}
          hiddenFitAnalysis={screening.hiddenFitAnalysis}
          hiddenFitIndicators={screening.hiddenFitIndicators}
        />

        {screening.psychometricAnalysis && (
          <>
            <Separator />
            <PsychometricAnalysis analysis={screening.psychometricAnalysis} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
