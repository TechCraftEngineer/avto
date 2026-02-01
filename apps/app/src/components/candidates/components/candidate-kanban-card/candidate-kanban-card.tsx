"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@qbs-autonaim/ui";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { useAvatarUrl } from "~/hooks/use-avatar-url";
import { getAvatarUrl } from "~/lib/avatar";
import { MatchScoreCircle } from "./match-score-circle";
import type { FunnelCandidate } from "./types";

interface CandidateKanbanCardProps {
  candidate: FunnelCandidate;
  onClick: () => void;
}

export function CandidateKanbanCard({
  candidate,
  onClick,
}: CandidateKanbanCardProps) {
  const photoUrl = useAvatarUrl(candidate.avatarFileId);
  const avatarUrl = getAvatarUrl(photoUrl, candidate.name);

  return (
    <div className="bg-card border rounded-lg shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30 flex flex-col group relative">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b">
        {candidate.messageCount !== undefined && candidate.messageCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="font-medium tabular-nums">
              {candidate.messageCount}
            </span>
          </div>
        )}
        {(candidate.messageCount === undefined ||
          candidate.messageCount === 0) && <div />}
        <MatchScoreCircle score={candidate.matchScore} size="sm" />
      </div>

      <button
        onClick={onClick}
        className="flex-1 p-3 cursor-pointer text-left focus:outline-none"
        type="button"
      >
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-10 w-10 border shrink-0">
            <AvatarImage src={avatarUrl} alt={candidate.name} />
            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
              {candidate.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm leading-tight break-words">
              {candidate.name}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5 break-words">
              {candidate.position}
            </p>
          </div>
        </div>
      </button>

      {/* Quick Actions - Visible on hover, absolute positioned to prevent layout shift */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-background/90 backdrop-blur-sm p-1 rounded-lg border shadow-sm z-10">
        {candidate.telegram && (
          <a
            href={`https://t.me/${candidate.telegram.replace("@", "")}`}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-[#2AABEE] transition-colors"
            onClick={(e) => e.stopPropagation()}
            title={`Telegram: ${candidate.telegram}`}
          >
            <svg
              role="img"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 fill-current"
            >
              <title>Telegram</title>
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 11.944 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
          </a>
        )}
        {candidate.email && (
          <a
            href={`mailto:${candidate.email}`}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => e.stopPropagation()}
            title={candidate.email}
          >
            <Mail className="h-4 w-4" />
          </a>
        )}
        {candidate.phone && (
          <a
            href={`tel:${candidate.phone}`}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-emerald-600 transition-colors"
            onClick={(e) => e.stopPropagation()}
            title={candidate.phone}
          >
            <Phone className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}
