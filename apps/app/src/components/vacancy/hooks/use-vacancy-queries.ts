import { useTRPC } from "~/trpc/react";

export function useVacancy(vacancyId: string, workspaceId: string) {
  const trpc = useTRPC();

  return trpc.vacancy.get.useQuery(
    {
      id: vacancyId,
      workspaceId,
    },
    {
      enabled: !!workspaceId,
      staleTime: 5 * 60 * 1000,
    },
  );
}

interface UseVacancyResponsesParams {
  workspaceId: string;
  vacancyId: string;
  page: number;
  limit: number;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  screeningFilter?: string;
  statusFilter?: string;
  search?: string;
}

export function useVacancyResponses(params: UseVacancyResponsesParams) {
  const trpc = useTRPC();

  return trpc.vacancy.responses.list.useQuery(
    {
      workspaceId: params.workspaceId,
      vacancyId: params.vacancyId,
      page: params.page,
      limit: params.limit,
      sortField: params.sortField,
      sortDirection: params.sortDirection,
      screeningFilter: params.screeningFilter,
      statusFilter: params.statusFilter,
      search: params.search,
    },
    {
      enabled: !!params.workspaceId,
      placeholderData: (previousData) => previousData,
    },
  );
}
