"use client";

import {
  Badge,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@qbs-autonaim/ui";
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
    if (score >= 4) return "text-green-600";
    if (score >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 4) return "Отличное соответствие";
    if (score === 3) return "Среднее соответствие";
    if (score === 2) return "Слабое соответствие";
    return "Не подходит";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 4) return "default";
    if (score >= 3) return "secondary";
    return "destructive";
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <Badge
            variant={getScoreBadgeVariant(screening.score)}
            className="gap-1.5 font-semibold tabular-nums"
          >
            <span>{screening.score}</span>
            {screening.detailedScore != null && (
              <>
                <span className="opacity-70">·</span>
                <span className="font-normal">
                  {Math.round(screening.detailedScore)}
                </span>
              </>
            )}
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
                  Общая оценка
                </p>
                <p
                  className={`text-2xl font-bold tabular-nums ${getScoreColor(screening.score)}`}
                >
                  {screening.score}
                </p>
              </div>
              <Badge
                variant={screening.score >= 3 ? "default" : "destructive"}
                className="text-xs"
              >
                {getScoreLabel(screening.score)}
              </Badge>
            </div>
            {screening.detailedScore != null && (
              <div className="mt-2 p-3 rounded-lg border bg-primary/5">
                <p className="text-sm text-muted-foreground mb-1">
                  Детальная оценка
                </p>
                <p className="text-2xl font-bold text-primary tabular-nums">
                  {Math.round(screening.detailedScore)}
                </p>
              </div>
            )}
          </div>

          {screening.analysis && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                {screening.score >= 3 ? (
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
