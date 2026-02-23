import { useQuery } from "@tanstack/react-query";
import { useORPC } from "~/orpc/react";
import type { ResponseStatusFilter } from "../components/responses/hooks/use-response-table";
import type { SortField } from "../components/responses/types";

export function useVacancy(vacancyId: string, workspaceId: string) {
  const orpc = useORPC();

  return useQuery({
    ...orpc.vacancy.get.queryOptions({
      input: { id: vacancyId, workspaceId },
    }),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
}

interface UseVacancyResponsesParams {
  workspaceId: string;
  vacancyId: string;
  page: number;
  limit: number;
  sortField?: SortField;
  sortDirection?: "asc" | "desc";
  screeningFilter?: string;
  statusFilter?: ResponseStatusFilter[];
  search?: string;
}

export function useVacancyResponses(params: UseVacancyResponsesParams) {
  const orpc = useORPC();

  return useQuery({
    ...orpc.vacancy.responses.list.queryOptions({
      input: {
        workspaceId: params.workspaceId,
        vacancyId: params.vacancyId,
        page: params.page,
        limit: params.limit,
        sortField: params.sortField ?? null,
        sortDirection: (params.sortDirection ?? "desc") as "asc" | "desc",
        screeningFilter: params.screeningFilter ?? "all",
        statusFilter: params.statusFilter,
        search: params.search,
      } as never,
    }),
    enabled: !!params.workspaceId,
  });
}
