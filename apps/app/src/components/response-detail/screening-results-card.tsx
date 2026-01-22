"use client";

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  Separator,
} from "@qbs-autonaim/ui";
import {
  Award,
  Banknote,
  Clock,
  FileText,
  TrendingUp,
  UserCheck,
  Sparkles,
} from "lucide-react";

interface ScreeningData {
  score: number;
  detailedScore: number;
  analysis: string | null | undefined;
  priceAnalysis?: string | null;
  deliveryAnalysis?: string | null;
  potentialScore?: number | null;
  careerTrajectoryScore?: number | null;
  careerTrajectoryType?: "growth" | "stable" | "decline" | "jump" | "role_change" | null;
  hiddenFitIndicators?: string[] | null;
  potentialAnalysis?: string | null;
  careerTrajectoryAnalysis?: string | null;
  hiddenFitAnalysis?: string | null;
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
          Мы отбираем тех, кто реально справится с задачей, а не тех, кто красиво написал резюме
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Score Overview */}
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium">
                Общая оценка
              </span>
              <span className="text-xl sm:text-2xl font-bold">
                {screening.score}/5
              </span>
            </div>
            <Progress
              value={((screening.score ?? 0) / 5) * 100}
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium">
                Детальная оценка
              </span>
              <span className="text-xl sm:text-2xl font-bold">
                {screening.detailedScore}/100
              </span>
            </div>
            <Progress value={screening.detailedScore ?? 0} className="h-2" />
          </div>

          {screening.potentialScore !== null &&
            screening.potentialScore !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Потенциал
                  </span>
                  <span className="text-xl sm:text-2xl font-bold">
                    {screening.potentialScore}/100
                  </span>
                </div>
                <Progress value={screening.potentialScore} className="h-2" />
              </div>
            )}

          {screening.careerTrajectoryScore !== null &&
            screening.careerTrajectoryScore !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Карьерная траектория
                  </span>
                  <span className="text-xl sm:text-2xl font-bold">
                    {screening.careerTrajectoryScore}/100
                  </span>
                </div>
                <Progress
                  value={screening.careerTrajectoryScore}
                  className="h-2"
                />
                {screening.careerTrajectoryType && (
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs">
                      {screening.careerTrajectoryType === "growth" && "Рост"}
                      {screening.careerTrajectoryType === "stable" && "Стабильность"}
                      {screening.careerTrajectoryType === "decline" && "Деградация"}
                      {screening.careerTrajectoryType === "jump" && "Скачок"}
                      {screening.careerTrajectoryType === "role_change" &&
                        "Смена роли"}
                    </Badge>
                  </div>
                )}
              </div>
            )}
        </div>

        {/* Hidden Fit Badge */}
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

        {/* Analysis Details */}
        <div className="space-y-3 sm:space-y-4">
          {screening.analysis && (
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                Анализ портфолио
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed wrap-break-word">
                {screening.analysis}
              </p>
            </div>
          )}

          {screening.priceAnalysis && (
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                <Banknote className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                Анализ цены
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed wrap-break-word">
                {screening.priceAnalysis}
              </p>
            </div>
          )}

          {screening.deliveryAnalysis && (
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                Анализ сроков
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed wrap-break-word">
                {screening.deliveryAnalysis}
              </p>
            </div>
          )}

          {screening.potentialAnalysis && (
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                Анализ потенциала
              </h4>
              <div
                className="text-xs sm:text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: screening.potentialAnalysis }}
              />
            </div>
          )}

          {screening.careerTrajectoryAnalysis && (
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                Анализ карьерной траектории
              </h4>
              <div
                className="text-xs sm:text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: screening.careerTrajectoryAnalysis,
                }}
              />
            </div>
          )}

          {screening.hiddenFitAnalysis && (
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                Скрытые индикаторы соответствия
              </h4>
              <div
                className="text-xs sm:text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: screening.hiddenFitAnalysis }}
              />
              {screening.hiddenFitIndicators &&
                screening.hiddenFitIndicators.length > 0 && (
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {screening.hiddenFitIndicators.map((indicator) => (
                      <li key={indicator} className="text-xs sm:text-sm">
                        {indicator}
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
