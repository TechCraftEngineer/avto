import { useMemo } from "react";

export interface Response {
  id: string;
  candidateName?: string | null;
  candidateId: string;
  status: string;
  hrSelectionStatus?: string | null;
  createdAt: Date | string;
  score?: number | null;
  proposedPrice?: number | null;
  screening?: {
    overallScore?: number | null;
  } | null;
}

export interface ResponseFiltersState {
  searchQuery: string;
  statusFilter: string;
  priceMin?: number | null;
  priceMax?: number | null;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  scoreMin?: number | null;
  scoreMax?: number | null;
}

interface UseResponseFiltersProps<T extends Response = Response> {
  responses: T[] | undefined;
  filters: ResponseFiltersState;
}

export const useResponseFilters = <T extends Response>({
  responses,
  filters,
}: UseResponseFiltersProps<T>) => {
  const filteredResponses = useMemo((): T[] => {
    if (!responses) return [] as T[];

    return responses.filter((response) => {
      // Search filter
      const matchesSearch =
        !filters.searchQuery ||
        response.candidateName
          ?.toLowerCase()
          .includes(filters.searchQuery.toLowerCase()) ||
        response.candidateId
          .toLowerCase()
          .includes(filters.searchQuery.toLowerCase());

      // Status filter
      let matchesStatus = true;
      if (filters.statusFilter === "all") {
        matchesStatus = true;
      } else if (filters.statusFilter === "recommended") {
        matchesStatus = response.hrSelectionStatus === "RECOMMENDED";
      } else if (filters.statusFilter === "unprocessed") {
        matchesStatus =
          response.status === "NEW" || response.status === "EVALUATED";
      } else {
        matchesStatus = response.status === filters.statusFilter;
      }

      // Price filter
      let matchesPrice = true;
      if (filters.priceMin !== null && filters.priceMin !== undefined) {
        matchesPrice = (response.proposedPrice ?? 0) >= filters.priceMin;
      }
      if (
        matchesPrice &&
        filters.priceMax !== null &&
        filters.priceMax !== undefined
      ) {
        matchesPrice = (response.proposedPrice ?? Infinity) <= filters.priceMax;
      }

      // Date filter
      let matchesDate = true;
      const responseDate = response.createdAt
        ? new Date(response.createdAt)
        : null;
      if (responseDate) {
        if (filters.dateFrom) {
          matchesDate = responseDate >= filters.dateFrom;
        }
        if (matchesDate && filters.dateTo) {
          // Set to end of day
          const dateToEnd = new Date(filters.dateTo);
          dateToEnd.setHours(23, 59, 59, 999);
          matchesDate = responseDate <= dateToEnd;
        }
      }

      // Score filter (screening)
      let matchesScore = true;
      const responseScore = response.screening?.overallScore ?? null;
      if (responseScore !== null) {
        if (filters.scoreMin !== null && filters.scoreMin !== undefined) {
          matchesScore = responseScore >= filters.scoreMin;
        }
        if (
          matchesScore &&
          filters.scoreMax !== null &&
          filters.scoreMax !== undefined
        ) {
          matchesScore = responseScore <= filters.scoreMax;
        }
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPrice &&
        matchesDate &&
        matchesScore
      );
    });
  }, [responses, filters]);

  // Calculate statistics for filter suggestions
  const stats = useMemo(() => {
    if (!responses || responses.length === 0) {
      return {
        total: 0,
        priceMin: 0,
        priceMax: 0,
        scoreMin: 0,
        scoreMax: 0,
        statusCounts: {} as Record<string, number>,
      };
    }

    const prices = responses
      .map((r) => r.proposedPrice)
      .filter((p): p is number => p !== null && p !== undefined);
    const scores = responses
      .map((r) => r.screening?.overallScore)
      .filter((s): s is number => s !== null && s !== undefined);

    const statusCounts: Record<string, number> = {};
    responses.forEach((r) => {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    });

    return {
      total: responses.length,
      priceMin: prices.length > 0 ? Math.min(...prices) : 0,
      priceMax: prices.length > 0 ? Math.max(...prices) : 0,
      scoreMin: scores.length > 0 ? Math.min(...scores) : 0,
      scoreMax: scores.length > 0 ? Math.max(...scores) : 0,
      statusCounts,
    };
  }, [responses]);

  return { filteredResponses, stats };
};
