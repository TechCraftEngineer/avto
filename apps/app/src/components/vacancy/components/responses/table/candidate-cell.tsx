"use client";

import type { ResponseListItem } from "./response-columns";
import { paths } from "@qbs-autonaim/config";
import { calculateAge } from "@qbs-autonaim/lib";
import { getInitials } from "@qbs-autonaim/shared";
import Link from "next/link";
import { useAvatarUrl } from "~/hooks/use-avatar-url";
import { getAvatarUrl } from "~/lib/avatar";
import { CandidateAvatar } from "../response-row/candidate-avatar";
import { CandidateBadges } from "../response-row/candidate-badges";
import { CandidateInfo } from "../response-row/candidate-info";

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

  return (
    <div className="flex items-center gap-3">
      <CandidateAvatar
        avatarUrl={avatarUrl}
        candidateName={candidateName}
        initials={initials}
      />
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={paths.workspace.vacancyResponse(
              orgSlug,
              workspaceSlug,
              vacancyId,
              response.id,
            )}
            className="font-medium text-sm hover:underline truncate transition-colors"
            prefetch={false}
          >
            {response.candidateName || "Без имени"}
          </Link>
          <CandidateBadges
            response={response}
            orgSlug={orgSlug}
            workspaceSlug={workspaceSlug}
          />
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
