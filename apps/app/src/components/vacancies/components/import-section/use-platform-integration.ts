import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTRPC } from "~/trpc/react";

export function usePlatformIntegration(workspaceId: string) {
  const trpc = useTRPC();

  // Получаем список интеграций
  const { data: integrations, isLoading: isLoadingIntegrations } = useQuery({
    ...trpc.integration.list.queryOptions({
      workspaceId,
    }),
    enabled: !!workspaceId,
  });

  // Получаем активные интеграции
  const activeIntegrations = useMemo(
    () => integrations?.filter((int) => int.isActive) ?? [],
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
      // Добавьте другие платформы по мере необходимости
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
