"use client";

import { useInngestSubscription } from "@inngest/realtime/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchVacancyStatsToken } from "~/actions/realtime";
import { useTRPC } from "~/trpc/react";

interface VacancyStats {
  views?: number;
  totalResponsesCount?: number;
  newResponses?: number;
  resumesInProgress?: number;
  isActive?: boolean;
}

interface VacancyQueryData {
  views?: number;
  totalResponsesCount?: number;
  newResponses?: number;
  resumesInProgress?: number;
  isActive?: boolean;
  [key: string]: unknown;
}

/**
 * Хук для realtime обновлений статистики вакансии
 * Автоматически обновляет кэш TanStack Query при получении новых данных
 */
export function useVacancyStats(vacancyId: string | undefined) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { latestData, state, error } = useInngestSubscription({
    refreshToken: () => {
      if (!vacancyId) throw new Error("vacancyId is required");
      return fetchVacancyStatsToken(vacancyId);
    },
    enabled: Boolean(vacancyId),
  });

  // Автоматически обновляем кэш при получении новых данных
  useEffect(() => {
    if (!latestData || !vacancyId) return;

    const data = latestData.data as VacancyStats;

    // Обновляем кэш конкретной вакансии
    queryClient.setQueryData(
      trpc.vacancy.get.queryKey({ id: vacancyId }),
      (oldData: VacancyQueryData | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          ...data,
        };
      },
    );

    // Инвалидируем список вакансий для обновления таблицы
    queryClient.invalidateQueries({
      queryKey: trpc.vacancy.list.queryKey(),
    });
  }, [latestData, vacancyId, queryClient, trpc]);

  return {
    stats: latestData?.data as VacancyStats | undefined,
    isConnected: state === "active",
    error,
  };
}
