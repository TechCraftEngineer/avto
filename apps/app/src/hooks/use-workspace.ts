"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useORPC } from "~/orpc/react";
import type {
  OrganizationDetail,
  WorkspaceDetail,
  WorkspaceRole,
} from "~/types/api";

interface UseWorkspaceReturn {
  workspace:
    | (WorkspaceDetail & {
        role: WorkspaceRole;
      })
    | undefined;
  organization: OrganizationDetail | undefined;
  orgSlug: string | undefined;
  slug: string | undefined;
  isLoading: boolean;
  organizationIsLoading: boolean;
  error: unknown;
  organizationError: unknown;
}

export function useWorkspace(): UseWorkspaceReturn {
  const params = useParams();
  const orgSlug = params.orgSlug as string | undefined;
  const slug = params.slug as string | undefined;
  const orpc = useORPC();

  const {
    data: organization,
    isLoading: organizationIsLoading,
    error: organizationError,
  } = useQuery(
    orpc.organization.getBySlug.queryOptions({
      input: { slug: orgSlug ?? "" },
      enabled: !!orgSlug,
    }),
  );

  const { data, isLoading, error } = useQuery(
    orpc.workspace.getBySlug.queryOptions({
      input: {
        organizationId: organization?.id ?? "",
        slug: slug ?? "",
      },
      enabled: !!organization?.id && !!slug,
    }),
  );

  return {
    workspace: data ? { ...data.workspace, role: data.role } : undefined,
    organization,
    orgSlug,
    slug,
    isLoading,
    organizationIsLoading,
    error,
    organizationError,
  };
}
