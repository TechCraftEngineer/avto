"use client";

import type { ComponentProps } from "react";
import { useWorkspaces } from "~/contexts/workspace-context";
import { AppSidebar } from "./app-sidebar";

export function AppSidebarWrapper({
  ...props
}: Omit<
  ComponentProps<typeof AppSidebar>,
  "activeWorkspaceId" | "activeOrganizationId"
>) {
  const { workspace, workspaceId } = useWorkspaces();

  // Определяем активную организацию по текущему воркспейсу
  const activeOrganizationId = workspace?.organizationId ?? undefined;

  return (
    <AppSidebar
      {...props}
      activeWorkspaceId={workspaceId}
      activeOrganizationId={activeOrganizationId}
    />
  );
}
