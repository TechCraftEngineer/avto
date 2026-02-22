"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@qbs-autonaim/ui/components/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@qbs-autonaim/ui/components/hover-card";
import { User } from "lucide-react";

interface CandidateAvatarProps {
  avatarUrl: string;
  candidateName: string;
  initials: string;
}

export function CandidateAvatar({
  avatarUrl,
  candidateName,
  initials,
}: CandidateAvatarProps) {
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-transform hover:scale-105"
          aria-label={`Фото ${candidateName}`}
        >
          <Avatar className="h-9 w-9 border shrink-0">
            <AvatarImage src={avatarUrl} alt={candidateName} />
            <AvatarFallback className="text-xs font-medium bg-muted text-muted-foreground">
              {initials || <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="right" className="w-auto p-2">
        <Avatar className="h-32 w-32 border-2">
          <AvatarImage src={avatarUrl} alt={candidateName} />
          <AvatarFallback className="text-4xl font-medium bg-muted text-muted-foreground">
            {initials || <User className="h-12 w-12" />}
          </AvatarFallback>
        </Avatar>
      </HoverCardContent>
    </HoverCard>
  );
}
