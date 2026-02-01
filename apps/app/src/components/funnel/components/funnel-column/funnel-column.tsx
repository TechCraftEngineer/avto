"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@qbs-autonaim/ui";
import { CandidateCard } from "../candidates/candidate-card";
import type { FunnelCandidate } from "../candidates/types";

interface FunnelColumnProps {
  title: string;
  count: number;
  candidates: FunnelCandidate[];
  onCardClick: (candidate: FunnelCandidate) => void;
  isLoading?: boolean;
}

export function FunnelColumn({
  title,
  count,
  candidates,
  onCardClick,
  isLoading,
}: FunnelColumnProps) {
  return (
    <div className="shrink-0 w-[280px] sm:w-[300px] md:w-[340px] snap-start">
      <Card className="h-full">
        <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 md:px-6">
          <CardTitle className="flex items-center justify-between text-sm sm:text-base">
            <span className="truncate">{title}</span>
            <span className="text-xs sm:text-sm font-medium text-muted-foreground bg-muted px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md tabular-nums">
              {count}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-4 md:px-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-48 bg-muted animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Нет кандидатов
            </div>
          ) : (
            candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onClick={() => onCardClick(candidate)}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
