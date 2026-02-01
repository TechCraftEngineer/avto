"use client";

import { sanitizeHtmlFunction } from "@qbs-autonaim/shared/client";

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
    <div>
      <h2 className="text-lg font-semibold mb-4">Скрининг</h2>
      <div className="space-y-3">
        {score !== null && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Оценка</p>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-teal-600">{score}</span>
              <span className="text-sm text-muted-foreground">из 5</span>
            </div>
            {detailedScore !== null && detailedScore !== undefined && (
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className="bg-teal-500 h-2 rounded-full transition-all"
                    style={{ width: `${detailedScore}%` }}
                  />
                </div>
                <span className="text-sm font-semibold">{detailedScore}%</span>
              </div>
            )}
          </div>
        )}
        {analysis && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Анализ</p>
            <div
              className="text-sm prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtmlFunction(analysis || ""),
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
