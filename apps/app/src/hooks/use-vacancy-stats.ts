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

/**
 * Хук для realtime обновлений статистики вакансии
 * Автоматически обновляет кэш TanStack Query при получении новых данных
 */
export function useVacancyStats(vacancyId: string | undefined) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { latestData, state, error } = useInngestSubscription({
    refreshToken: () => fetchVacancyStatsToken(vacancyId!),
    enabled: Boolean(vacancyId),
  });

  // Автоматически обновляем кэш при получении новых данных
  useEffect(() => {
    if (!latestData || !vacancyId) return;

    const data = latestData.data as VacancyStats;

    // Обновляем кэш конкретной вакансии
    queryClient.setQueryData(
      trpc.vacancies.getById.queryKey({ id: vacancyId }),
      (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          ...data,
        };
      },
    );

    // Инвалидируем список вакансий для обновления таблицы
    queryClient.invalidateQueries({
      queryKey: trpc.vacancies.list.queryKey(),
    });
  }, [latestData, vacancyId, queryClient, trpc]);

  return {
    stats: latestData?.data as VacancyStats | undefined,
    isConnected: state === "active",
    error,
  };
}
