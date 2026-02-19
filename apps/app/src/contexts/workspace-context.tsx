"use client";

import { useParams } from "next/navigation";
import { createContext, useContext, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";

type WorkspaceWithRole = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: "owner" | "admin" | "member";
  organizationSlug: string | undefined;
  organizationId: string | null;
  memberCount?: number;
  plan?: string;
};

type OrganizationWithRole = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: "owner" | "admin" | "member";
  memberCount: number;
  workspaceCount: number;
  plan?: string;
};

export type { WorkspaceWithRole, OrganizationWithRole };

type WorkspaceContextType = {
  workspaces: WorkspaceWithRole[];
  organizations: OrganizationWithRole[];
  workspace?: WorkspaceWithRole;
  workspaceId?: string;
};

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

const LAST_WORKSPACE_KEY = "lastActiveWorkspace";

export function WorkspaceProvider({
  children,
  workspaces,
  organizations,
}: {
  children: React.ReactNode;
  workspaces: WorkspaceWithRole[];
  organizations: OrganizationWithRole[];
}) {
  const params = useParams();
  const workspaceSlug = params?.slug as string | undefined;
  const trpc = useTRPC();
  const { mutate: setActiveWorkspace } = useMutation(
    trpc.user.setActiveWorkspace.mutationOptions(),
  );

  const workspace = useMemo(() => {
    // Если есть slug в URL, используем его
    if (workspaceSlug) {
      return workspaces.find((w) => w.slug === workspaceSlug);
    }

    // Если нет slug в URL, пытаемся использовать последний активный workspace
    if (typeof window !== "undefined") {
      const lastWorkspaceData = localStorage.getItem(LAST_WORKSPACE_KEY);
      if (lastWorkspaceData) {
        try {
          const { slug, orgSlug } = JSON.parse(lastWorkspaceData);
          return workspaces.find(
            (w) => w.slug === slug && w.organizationSlug === orgSlug,
          );
        } catch {
          // Игнорируем ошибки парсинга
        }
      }
    }

    // Fallback на первый доступный workspace
    return workspaces[0];
  }, [workspaces, workspaceSlug]);

  // Сохраняем активный workspace в localStorage и БД когда он определен из URL
  useEffect(() => {
    if (
      workspace &&
      workspaceSlug &&
      workspace.organizationSlug &&
      typeof window !== "undefined"
    ) {
      localStorage.setItem(
        LAST_WORKSPACE_KEY,
        JSON.stringify({
          slug: workspace.slug,
          orgSlug: workspace.organizationSlug,
        }),
      );

      if (workspace.organizationId) {
        setActiveWorkspace({
          organizationId: workspace.organizationId,
          workspaceId: workspace.id,
        });
      }
    }
  }, [workspace, workspaceSlug, setActiveWorkspace]);

  const value = useMemo(
    () => ({
      workspaces,
      organizations,
      workspace,
      workspaceId: workspace?.id,
    }),
    [workspaces, organizations, workspace],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaces() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error(
      "useWorkspaces должен использоваться внутри WorkspaceProvider",
    );
  }
  return context;
}

// Алиас для обратной совместимости
export function useWorkspaceContext() {
  return useWorkspaces();
}
