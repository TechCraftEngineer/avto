"use client";

import { AIVacancyChat } from "~/components/vacancy-chat";

interface VacancyCreatorContainerProps {
  workspaceId: string;
  orgSlug: string;
  workspaceSlug: string;
}

export function VacancyCreatorContainer({
  workspaceId,
  orgSlug,
  workspaceSlug,
}: VacancyCreatorContainerProps) {
  return (
    <AIVacancyChat
      workspaceId={workspaceId}
      orgSlug={orgSlug}
      workspaceSlug={workspaceSlug}
    />
  );
}
