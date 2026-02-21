"use client";

import { paths } from "@qbs-autonaim/config";
import { calculateAge } from "@qbs-autonaim/lib/utils";
import { getInitials } from "@qbs-autonaim/shared";
import Link from "next/link";
import { useAvatarUrl } from "~/hooks/use-avatar-url";
import { getAvatarUrl } from "~/lib/avatar";
import { CandidateAvatar } from "../response-row/candidate-avatar";
import { CandidateBadges } from "../response-row/candidate-badges";
import { CandidateInfo } from "../response-row/candidate-info";
import type { ResponseListItem } from "./types";

interface CandidateCellProps {
  response: ResponseListItem;
  orgSlug: string;
  workspaceSlug: string;
  vacancyId: string;
}

export function CandidateCell({
  response,
  orgSlug,
  workspaceSlug,
  vacancyId,
}: CandidateCellProps) {
  const photoUrl = useAvatarUrl(response.photoFileId);
  const candidateName = response.candidateName || "Кандидат";
  const avatarUrl = getAvatarUrl(photoUrl, candidateName);
  const initials = getInitials(candidateName);
  const age = response.birthDate ? calculateAge(response.birthDate) : null;
  const location = response.globalCandidate?.location || null;

  const displayName = response.candidateName || "Без имени";

  return (
    <div className="flex min-w-0 items-center gap-3 overflow-hidden">
      <CandidateAvatar
        avatarUrl={avatarUrl}
        candidateName={candidateName}
        initials={initials}
      />
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={paths.workspace.vacancyResponse(
              orgSlug,
              workspaceSlug,
              vacancyId,
              response.id,
            )}
            className="min-w-0 truncate font-medium text-sm transition-colors hover:underline"
            prefetch={false}
            title={displayName}
          >
            {displayName}
          </Link>
          <div className="shrink-0">
            <CandidateBadges
              response={response}
              orgSlug={orgSlug}
              workspaceSlug={workspaceSlug}
            />
          </div>
        </div>
        <CandidateInfo
          age={age}
          birthDate={response.birthDate}
          location={location}
          phone={response.phone}
          email={response.email}
        />
      </div>
    </div>
  );
}
