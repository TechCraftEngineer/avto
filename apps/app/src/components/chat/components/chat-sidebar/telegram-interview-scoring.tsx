"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import { Label } from "@qbs-autonaim/ui/components/label";
import { Progress } from "@qbs-autonaim/ui/components/progress";
import { Star } from "lucide-react";
import { sanitizeHtmlFunction } from "~/lib/sanitize-html";

interface TelegramInterviewScoringProps {
  score: number | null;
  detailedScore?: number | null;
  analysis?: string | null;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-600 dark:text-green-500";
  if (score >= 60) return "text-yellow-600 dark:text-yellow-500";
  return "text-red-600 dark:text-red-500";
};

const getProgressColor = (score: number) => {
  if (score >= 80) return "bg-green-600";
  if (score >= 60) return "bg-yellow-600";
  return "bg-red-600";
};

export function TelegramInterviewScoring({
  score,
  detailedScore,
  analysis,
}: TelegramInterviewScoringProps) {
  if (!score && !detailedScore) {
    return null;
  }

  return (
    <Card size="sm">
      <CardHeader className="p-0 pb-3">
        <CardTitle className="text-base">Telegram интервью</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0">
        {score !== null && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              Общая оценка
            </Label>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="text-2xl font-bold text-yellow-600">
                {score}
              </span>
              <span className="text-sm text-muted-foreground">из 5</span>
            </div>
          </div>
        )}

        {detailedScore != null && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Детальная оценка
            </Label>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-2xl font-bold ${getScoreColor(detailedScore)}`}
              >
                {detailedScore}
              </span>
              <span className="text-sm text-muted-foreground">из 100</span>
            </div>
            <Progress
              value={detailedScore}
              indicatorClassName={getProgressColor(detailedScore)}
              className="h-2"
            />
          </div>
        )}

        {analysis && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Анализ</Label>
            <div
              className="text-sm prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtmlFunction(analysis || ""),
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
