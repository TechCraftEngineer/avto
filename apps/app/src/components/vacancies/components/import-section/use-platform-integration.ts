import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTRPC } from "~/trpc/react";

/** Платформы, которые поддерживают только импорт gigs (разовые задания) */
const GIG_ONLY_PLATFORMS = ["kwork"] as const;

export function usePlatformIntegration(workspaceId: string) {
  const trpc = useTRPC();

  // Получаем список интеграций
  const { data: integrations, isLoading: isLoadingIntegrations } = useQuery({
    ...trpc.integration.list.queryOptions({
      workspaceId,
    }),
    enabled: !!workspaceId,
  });

  // Получаем активные интеграции для вакансий (исключая gig-платформы)
  const activeIntegrations = useMemo(
    () =>
      integrations?.filter(
        (int) =>
          int.isActive &&
          !GIG_ONLY_PLATFORMS.includes(
            int.type as (typeof GIG_ONLY_PLATFORMS)[number],
          ),
      ) ?? [],
    [integrations],
  );

  // Состояние выбранной платформы
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");

  // Автоматически выбираем платформу, если она одна
  useEffect(() => {
    if (activeIntegrations.length === 1 && !selectedPlatform) {
      const integration = activeIntegrations[0];
      if (integration) {
        setSelectedPlatform(integration.type);
      }
    }
  }, [activeIntegrations, selectedPlatform]);

  // Получаем текущую выбранную интеграцию
  const currentIntegration = useMemo(
    () => activeIntegrations.find((int) => int.type === selectedPlatform),
    [activeIntegrations, selectedPlatform],
  );

  // Проверяем наличие активных интеграций
  const hasActiveIntegrations = activeIntegrations.length > 0;

  // Получаем название платформы для отображения
  const getPlatformName = (type: string) => {
    const names: Record<string, string> = {
      hh: "HeadHunter",
      avito: "Avito",
      superjob: "SuperJob",
      fl: "FL.ru",
      freelance: "Freelance.ru",
    };
    return names[type] ?? type.toUpperCase();
  };

  return {
    integrations,
    isLoadingIntegrations,
    activeIntegrations,
    selectedPlatform,
    setSelectedPlatform,
    currentIntegration,
    hasActiveIntegrations,
    getPlatformName,
  };
}
