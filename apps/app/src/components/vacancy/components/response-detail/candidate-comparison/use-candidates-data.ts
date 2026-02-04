import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";
import type { VacancyResponseFromList } from "../types";
import type { CandidateMetrics } from "./types";
import {
  calculateLastActivity,
  calculateMatchScore,
  calculateResponseTime,
  getExperienceFromProfile,
} from "./utils";

interface UseCandidatesDataProps {
  vacancyId: string;
}

export function useCandidatesData({ vacancyId }: UseCandidatesDataProps) {
  const { workspace } = useWorkspace();
  const trpc = useTRPC();

  // Получаем все отклики вакансии
  const { data: responsesData, isLoading } = useQuery(
    trpc.vacancy.responses.list.queryOptions({
      workspaceId: workspace?.id ?? "",
      vacancyId,
      page: 1,
      limit: 100, // Получаем больше для сравнения
      sortField: "createdAt",
      sortDirection: "desc",
    }),
  );

  // Преобразуем отклики в метрики кандидатов
  const candidates = useMemo<CandidateMetrics[]>(() => {
    if (!responsesData?.responses) return [];

    return responsesData.responses.map((response: VacancyResponseFromList) => ({
      id: response.id,
      name: response.candidateName || "Без имени",
      matchScore: calculateMatchScore(response as any),
      salary: response.salaryExpectationsAmount,
      experience: getExperienceFromProfile(response as any),
      skills: response.skills || [],
      responseTime: calculateResponseTime(response as any),
      status: response.status,
      lastActivity: calculateLastActivity(response as any),
    }));
  }, [responsesData]);

  return {
    candidates,
    isLoading,
    total: responsesData?.total ?? 0,
  };
}
