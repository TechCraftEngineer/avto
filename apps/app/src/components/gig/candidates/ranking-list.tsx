"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Separator,
} from "@qbs-autonaim/ui";
import { Award, Trophy } from "lucide-react";
import { RankedCandidateCard } from "./ranked-candidate-card";

type RankedCandidate =
  RouterOutputs["gig"]["responses"]["ranked"]["candidates"][number];

interface RankingListProps {
  candidates: RankedCandidate[];
  orgSlug: string;
  workspaceSlug: string;
  gigId: string;
  onAccept?: (responseId: string) => void;
  onReject?: (responseId: string) => void;
  onMessage?: (responseId: string) => void;
  isLoading?: boolean;
}

export function RankingList({
  candidates,
  orgSlug,
  workspaceSlug,
  gigId,
  onAccept,
  onReject,
  onMessage,
  isLoading,
}: RankingListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-64 rounded-lg border bg-muted/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!isLoading && candidates.length === 0) {
    return (
      <Alert>
        <Award className="h-4 w-4" />
        <AlertTitle>Нет кандидатов для отображения</AlertTitle>
        <AlertDescription>
          Попробуйте изменить фильтры или дождитесь появления новых откликов.
        </AlertDescription>
      </Alert>
    );
  }

  // Разделяем кандидатов на топ-3 и остальных
  const topThree = candidates.filter(
    (c) => c.rankingPosition && c.rankingPosition <= 3,
  );
  const others = candidates.filter(
    (c) => !c.rankingPosition || c.rankingPosition > 3,
  );

  return (
    <div className="space-y-6">
      {/* Top 3 Candidates Section */}
      {topThree.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Топ-3 кандидата</h2>
          </div>

          <div className="space-y-4">
            {topThree.map((candidate) => (
              <RankedCandidateCard
                key={candidate.id}
                candidate={candidate}
                orgSlug={orgSlug}
                workspaceSlug={workspaceSlug}
                gigId={gigId}
                onAccept={onAccept}
                onReject={onReject}
                onMessage={onMessage}
                showRank={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Separator between top 3 and others */}
      {topThree.length > 0 && others.length > 0 && (
        <Separator className="my-6" />
      )}

      {/* Other Candidates Section */}
      {others.length > 0 && (
        <div className="space-y-4">
          {topThree.length > 0 && (
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-muted-foreground">
                Остальные кандидаты
              </h2>
            </div>
          )}

          <div className="space-y-4">
            {others.map((candidate) => (
              <RankedCandidateCard
                key={candidate.id}
                candidate={candidate}
                orgSlug={orgSlug}
                workspaceSlug={workspaceSlug}
                gigId={gigId}
                onAccept={onAccept}
                onReject={onReject}
                onMessage={onMessage}
                showRank={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
