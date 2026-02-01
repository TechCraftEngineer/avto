"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@qbs-autonaim/ui";
import { MapPin } from "lucide-react";
import { useAvatarUrl } from "~/hooks/use-avatar-url";
import { getAvatarUrl } from "~/lib/avatar";
import { MatchScoreCircle } from "./match-score-circle";
import type { FunnelCandidate } from "./types";

interface CandidateCardProps {
  candidate: FunnelCandidate;
  onClick: () => void;
}

export function CandidateCard({ candidate, onClick }: CandidateCardProps) {
  const photoUrl = useAvatarUrl(candidate.avatarFileId);
  const avatarUrl = getAvatarUrl(photoUrl, candidate.name);

  return (
    <button
      type="button"
      className="bg-card border rounded-lg shadow-lg p-3 w-[280px] cursor-grabbing text-left"
      onClick={onClick}
      aria-label={`Кандидат ${candidate.name}`}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border shrink-0">
          <AvatarImage src={avatarUrl} alt={candidate.name} />
          <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
            {candidate.initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{candidate.name}</h4>
          <p className="text-xs text-muted-foreground truncate">
            {candidate.position}
          </p>
        </div>
        <MatchScoreCircle score={candidate.matchScore} size="sm" />
      </div>

      <div className="flex items-center gap-2 mt-3 pt-2 border-t text-xs text-muted-foreground">
        {candidate.location && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{candidate.location}</span>
          </div>
        )}
        {candidate.experience && (
          <>
            {candidate.location && <span>•</span>}
            <span>{candidate.experience}</span>
          </>
        )}
      </div>
    </button>
  );
}
