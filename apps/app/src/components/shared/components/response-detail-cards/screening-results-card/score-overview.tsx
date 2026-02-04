import { Badge, Progress } from "@qbs-autonaim/ui";
import { Brain, Sparkles, TrendingUp } from "lucide-react";

interface ScoreOverviewProps {
  score: number;
  detailedScore: number;
  potentialScore?: number | null;
  careerTrajectoryScore?: number | null;
  careerTrajectoryType?:
    | "growth"
    | "stable"
    | "decline"
    | "jump"
    | "role_change"
    | null;
  psychometricScore?: number | null;
}

const TRAJECTORY_LABELS = {
  growth: "Рост",
  stable: "Стабильность",
  decline: "Деградация",
  jump: "Скачок",
  role_change: "Смена роли",
} as const;

export function ScoreOverview({
  score,
  detailedScore,
  potentialScore,
  careerTrajectoryScore,
  careerTrajectoryType,
  psychometricScore,
}: ScoreOverviewProps) {
  return (
    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-medium">Общая оценка</span>
          <span className="text-xl sm:text-2xl font-bold">{score}/5</span>
        </div>
        <Progress value={((score ?? 0) / 5) * 100} className="h-2" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-medium">
            Детальная оценка
          </span>
          <span className="text-xl sm:text-2xl font-bold">
            {detailedScore}/100
          </span>
        </div>
        <Progress value={detailedScore ?? 0} className="h-2" />
      </div>

      {potentialScore !== null && potentialScore !== undefined && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Потенциал
            </span>
            <span className="text-xl sm:text-2xl font-bold">
              {potentialScore}/100
            </span>
          </div>
          <Progress value={potentialScore} className="h-2" />
        </div>
      )}

      {careerTrajectoryScore !== null &&
        careerTrajectoryScore !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Карьерная траектория
              </span>
              <span className="text-xl sm:text-2xl font-bold">
                {careerTrajectoryScore}/100
              </span>
            </div>
            <Progress value={careerTrajectoryScore} className="h-2" />
            {careerTrajectoryType && (
              <div className="mt-1">
                <Badge variant="outline" className="text-xs">
                  {TRAJECTORY_LABELS[careerTrajectoryType]}
                </Badge>
              </div>
            )}
          </div>
        )}

      {psychometricScore !== null && psychometricScore !== undefined && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium flex items-center gap-1">
              <Brain className="h-3 w-3" />
              Психологическая совместимость
            </span>
            <span className="text-xl sm:text-2xl font-bold">
              {psychometricScore}/100
            </span>
          </div>
          <Progress value={psychometricScore} className="h-2" />
        </div>
      )}
    </div>
  );
}
