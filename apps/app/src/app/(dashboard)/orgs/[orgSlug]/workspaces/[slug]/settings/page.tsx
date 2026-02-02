"use client";

import { env as baseEnv } from "@qbs-autonaim/config";
import Skeleton from "@qbs-autonaim/ui/skeleton";
import { WorkspaceForm } from "~/components";
import { useWorkspace } from "~/hooks/use-workspace";

export default function SettingsPage() {
  const { workspace, isLoading } = useWorkspace();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-32" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <p className="text-muted-foreground">Рабочее пространство не найдено</p>
    );
  }

  return (
    <WorkspaceForm
      initialData={{
        name: workspace.name,
        slug: workspace.slug,
        logo: workspace.logo,
      }}
      workspaceId={workspace.id}
      userRole={workspace.role}
      appUrl={baseEnv.NEXT_PUBLIC_APP_URL}
    />
  );
}

