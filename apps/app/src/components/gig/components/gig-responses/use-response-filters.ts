import { useMemo } from "react";

export interface Response {
  id: string;
  candidateName?: string | null;
  candidateId: string;
  status: string;
  hrSelectionStatus?: string | null;
  createdAt: Date | string;
  score?: number | null;
}

interface UseResponseFiltersProps<T extends Response = Response> {
  responses: T[] | undefined;
  searchQuery: string;
  statusFilter: string;
  activeTab: string;
}

export const useResponseFilters = <T extends Response>({
  responses,
  searchQuery,
  statusFilter,
  activeTab,
}: UseResponseFiltersProps<T>) => {
  const filteredResponses = useMemo((): T[] => {
    if (!responses) return [] as T[];

    return responses.filter((response) => {
      const matchesSearch =
        !searchQuery ||
        response.candidateName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        response.candidateId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || response.status === statusFilter;

      const matchesTab =
        activeTab === "all" ||
        (activeTab === "new" && response.status === "NEW") ||
        (activeTab === "evaluated" && response.status === "EVALUATED") ||
        (activeTab === "recommended" &&
          response.hrSelectionStatus === "RECOMMENDED");

      return matchesSearch && matchesStatus && matchesTab;
    });
  }, [responses, searchQuery, statusFilter, activeTab]);

  return { filteredResponses };
};
