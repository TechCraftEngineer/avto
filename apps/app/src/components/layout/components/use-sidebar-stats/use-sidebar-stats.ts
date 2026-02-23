"use client";

import { useQuery } from "@tanstack/react-query";
import { useORPC } from "~/orpc/react";

export function useSidebarStats(workspaceId: string | undefined) {
  const orpc = useORPC();

  const {
    data: dashboardStats,
    error,
    isError,
    isLoading,
  } = useQuery(
    orpc.vacancy.dashboardStats.queryOptions({
      input: {
        workspaceId: workspaceId ?? "",
      },
      enabled: !!workspaceId,
      staleTime: 30_000, // 30 секунд — не перезапрашиваем слишком часто
      refetchInterval: 60_000, // Обновляем каждую минуту
    }),
  );

  if (isError) {
    console.error(
      `[useSidebarStats] Failed to fetch stats for workspace ${workspaceId}:`,
      error?.message ?? error,
    );
  }

  return {
    newResponses: dashboardStats?.newResponses ?? 0,
    totalResponses: dashboardStats?.totalResponses ?? 0,
    activeVacancies: dashboardStats?.activeVacancies ?? 0,
    highScoreResponses: dashboardStats?.highScoreResponses ?? 0,
    error,
    isError,
    isLoading,
  };
}
