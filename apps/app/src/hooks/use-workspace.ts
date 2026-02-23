"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useORPC } from "~/orpc/react";
import type { WorkspaceRole } from "~/types/api";

interface UseWorkspaceReturn {
  workspace:
    | {
        role: WorkspaceRole;
        id: string;
        name: string;
        createdAt: Date;
        description: string | null;
        externalId: string | null;
        logo: string | null;
        slug: string;
        plan: "free" | "pro" | "enterprise";
        updatedAt: Date;
        organizationId: string;
        organizationSlug: string;
        website: string | null;
        memberCount: number;
        dismissedGettingStartedAt: Date | null;
      }
    | undefined;
  organization:
    | {
        id: string;
        name: string;
        createdAt: Date;
        description: string | null;
        externalId: string | null;
        logo: string | null;
        slug: string;
        plan: "free" | "starter" | "pro" | "enterprise";
        billingEmail: string | null;
        updatedAt: Date;
        website: string | null;
        memberCount?: number;
        workspaceCount?: number;
      }
    | undefined;
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
    workspace: data
      ? {
          ...data.workspace,
          role: data.role,
          organizationSlug: organization?.slug ?? "",
          memberCount: 0,
        }
      : undefined,
    organization,
    orgSlug,
    slug,
    isLoading,
    organizationIsLoading,
    error,
    organizationError,
  };
}
