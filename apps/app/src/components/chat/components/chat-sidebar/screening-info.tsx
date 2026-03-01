"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import { Label } from "@qbs-autonaim/ui/components/label";
import { Progress } from "@qbs-autonaim/ui/components/progress";
import { sanitizeHtmlFunction } from "~/lib/sanitize-html";

interface ScreeningInfoProps {
  score: number | null;
  detailedScore?: number | null;
  analysis?: string | null;
}

export function ScreeningInfo({
  score,
  detailedScore,
  analysis,
}: ScreeningInfoProps) {
  return (
    <Card size="sm">
      <CardHeader className="p-0 pb-3">
        <CardTitle className="text-base">Скрининг</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0">
        {score !== null && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Оценка</Label>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">{score}</span>
              <span className="text-sm text-muted-foreground">из 5</span>
            </div>
            {detailedScore != null && (
              <div className="flex items-center gap-2">
                <Progress
                  value={Math.max(0, Math.min(100, detailedScore))}
                  className="flex-1"
                />
                <span className="text-sm font-medium shrink-0">
                  {Math.round(Math.max(0, Math.min(100, detailedScore)))}%
                </span>
              </div>
            )}
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
