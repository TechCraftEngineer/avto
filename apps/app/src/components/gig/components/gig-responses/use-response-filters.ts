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
}

export const useResponseFilters = <T extends Response>({
  responses,
  searchQuery,
  statusFilter,
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
        statusFilter === "all"
          ? true
          : statusFilter === "recommended"
            ? response.hrSelectionStatus === "RECOMMENDED"
            : response.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [responses, searchQuery, statusFilter]);

  return { filteredResponses };
};
