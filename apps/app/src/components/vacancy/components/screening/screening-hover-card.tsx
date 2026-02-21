"use client";

import { Badge } from "@qbs-autonaim/ui/components/badge"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@qbs-autonaim/ui/components/hover-card";
import { CheckCircle2, Info, XCircle } from "lucide-react";

interface ScreeningData {
  score: number;
  detailedScore?: number | null;
  analysis: string | null;
}

interface ScreeningHoverCardProps {
  screening: ScreeningData;
}

export function ScreeningHoverCard({ screening }: ScreeningHoverCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Отличное соответствие";
    if (score >= 60) return "Хорошее соответствие";
    if (score >= 40) return "Среднее соответствие";
    return "Не подходит";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  const displayScore = screening.detailedScore ?? screening.score * 20;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <Badge
            variant={getScoreBadgeVariant(displayScore)}
            className="gap-1.5 font-semibold tabular-nums"
          >
            <span>{Math.round(displayScore)}</span>
          </Badge>
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        className="w-96 max-h-[600px] overflow-y-auto"
        side="left"
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              Оценка кандидата
            </h4>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Детальная оценка
                </p>
                <p
                  className={`text-2xl font-bold tabular-nums ${getScoreColor(displayScore)}`}
                >
                  {Math.round(displayScore)}
                </p>
              </div>
              <Badge
                variant={displayScore >= 60 ? "default" : "destructive"}
                className="text-xs"
              >
                {getScoreLabel(displayScore)}
              </Badge>
            </div>
          </div>

          {screening.analysis && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                {displayScore >= 60 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                Анализ
              </h4>
              <div
                className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: screening.analysis,
                }}
              />
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
