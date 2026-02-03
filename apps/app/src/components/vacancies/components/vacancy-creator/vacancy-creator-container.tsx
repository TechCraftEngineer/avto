"use client";

import dynamic from "next/dynamic";

const AIVacancyChat = dynamic(
  () =>
    import("~/components/chat/components/vacancy-chat/ai-vacancy-chat").then(
      (mod) => mod.AIVacancyChat,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full flex-col">
        <div className="border-b bg-background px-4 py-3 md:px-6 animate-pulse">
          <div className="h-6 bg-muted rounded w-64 mb-2" />
          <div className="h-4 bg-muted rounded w-96" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-32 mb-4" />
            <div className="h-4 bg-muted rounded w-48" />
          </div>
        </div>
      </div>
    ),
  },
);

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
