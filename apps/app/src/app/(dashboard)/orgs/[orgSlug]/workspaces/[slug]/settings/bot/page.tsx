"use client";

import { Skeleton } from "@qbs-autonaim/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { BotSettingsForm } from "~/components";
import { useWorkspace } from "~/hooks/use-workspace";
import { useORPC } from "~/orpc/react";

export default function SettingsBotPage() {
  const orpc = useORPC();
  const { workspace, isLoading: workspaceLoading } = useWorkspace();

  const workspaceId = workspace?.id;
  const userRole = workspace?.role;

  const { data: botSettings, isLoading } = useQuery({
    ...orpc.workspace.getBotSettings.queryOptions({
      workspaceId: workspaceId || "",
    }),
    enabled: !!workspaceId,
  });

  if (isLoading || workspaceLoading || !workspaceId) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <BotSettingsForm
      workspaceId={workspaceId}
      initialData={{
        companyName: botSettings?.companyName || "",
        companyWebsite: botSettings?.companyWebsite || "",
        companyDescription: botSettings?.companyDescription || "",
        botName: botSettings?.botName || "",
        botRole: botSettings?.botRole || "",
      }}
      userRole={userRole}
    />
  );
}
