"use client";

import type { GigResponseListItem } from "~/components/responses/types";
import { calculateAge } from "@qbs-autonaim/lib/utils";
import { getInitials } from "@qbs-autonaim/shared";
import Link from "next/link";
import { useAvatarUrl } from "~/hooks/use-avatar-url";
import { getAvatarUrl } from "~/lib/avatar";
import { CandidateAvatar } from "~/components/vacancy/components/responses/response-row/candidate-avatar";
import { CandidateInfo } from "~/components/vacancy/components/responses/response-row/candidate-info";

interface GigCandidateCellProps {
  response: GigResponseListItem;
  orgSlug: string;
  workspaceSlug: string;
  gigId: string;
}

const gigResponseUrl = (
  orgSlug: string,
  workspaceSlug: string,
  gigId: string,
  responseId: string,
) =>
  `/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/responses/${responseId}`;

export function GigCandidateCell({
  response,
  orgSlug,
  workspaceSlug,
  gigId,
}: GigCandidateCellProps) {
  const photoUrl = useAvatarUrl(response.photoFileId);
  const candidateName = response.candidateName || "Кандидат";
  const profileData = response.profileData as
    | { kworkAvatarUrl?: string }
    | null
    | undefined;
  const fallbackAvatar =
    !photoUrl && profileData?.kworkAvatarUrl
      ? profileData.kworkAvatarUrl
      : photoUrl;
  const avatarUrl = getAvatarUrl(fallbackAvatar, candidateName);
  const initials = getInitials(candidateName);
  const age = response.birthDate ? calculateAge(response.birthDate) : null;

  return (
    <div className="flex items-center gap-3">
      <CandidateAvatar
        avatarUrl={avatarUrl}
        candidateName={candidateName}
        initials={initials}
      />
      <div className="flex flex-col min-w-0">
        <Link
          href={gigResponseUrl(orgSlug, workspaceSlug, gigId, response.id)}
          className="font-medium text-sm hover:underline truncate transition-colors"
          prefetch={false}
        >
          {response.candidateName || "Без имени"}
        </Link>
        <CandidateInfo
          age={age}
          birthDate={response.birthDate}
          location={null}
          phone={response.phone}
          email={response.email}
        />
      </div>
    </div>
  );
}
