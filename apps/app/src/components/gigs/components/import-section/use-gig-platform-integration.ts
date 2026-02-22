import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useORPC } from "~/orpc/react";

/** Интеграции фриланс-платформ, поддерживающих импорт gigs (пока только Kwork) */
const GIG_IMPORT_PLATFORMS = ["kwork"] as const;

export function useGigPlatformIntegration(workspaceId: string) {
  const orpc = useORPC();

  const { data: integrations, isLoading: isLoadingIntegrations } = useQuery({
    ...orpc.integration.list.queryOptions({
      workspaceId,
    }),
    enabled: !!workspaceId,
  });

  const activeIntegrations = useMemo(
    () =>
      integrations?.filter(
        (int) =>
          int.isActive &&
          GIG_IMPORT_PLATFORMS.includes(
            int.type as (typeof GIG_IMPORT_PLATFORMS)[number],
          ),
      ) ?? [],
    [integrations],
  );

  const hasKworkIntegration = useMemo(
    () => activeIntegrations.some((int) => int.type === "kwork"),
    [activeIntegrations],
  );

  const getPlatformName = (type: string) => {
    const names: Record<string, string> = {
      kwork: "Kwork",
    };
    return names[type] ?? type;
  };

  return {
    integrations,
    isLoadingIntegrations,
    activeIntegrations,
    hasKworkIntegration,
    hasActiveIntegrations: activeIntegrations.length > 0,
    getPlatformName,
  };
}
