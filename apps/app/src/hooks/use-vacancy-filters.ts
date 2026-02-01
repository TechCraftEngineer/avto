import { useMemo, useState } from "react";

interface Vacancy {
  id: string;
  title: string;
  source: string;
  region: string | null;
  workLocation: string | null;
  views: number | null;
  totalResponsesCount: number | null;
  newResponses: number | null;
  resumesInProgress: number | null;
  isActive: boolean | null;
  createdAt: Date;
}

export function useVacancyFilters(vacancies: Vacancy[] | undefined) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "createdAt" | "title" | "views" | "responses" | "newResponses"
  >("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const filteredAndSortedVacancies = useMemo(() => {
    if (!vacancies) return [];

    let filtered = [...vacancies];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.title.toLowerCase().includes(query) ||
          v.region?.toLowerCase().includes(query),
      );
    }

    if (sourceFilter !== "all") {
      filtered = filtered.filter((v) => v.source === sourceFilter);
    }

    if (statusFilter === "active") {
      filtered = filtered.filter((v) => v.isActive === true);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((v) => v.isActive === false);
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter((v) => new Date(v.createdAt) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((v) => new Date(v.createdAt) <= toDate);
    }

    return filtered;
  }, [vacancies, searchQuery, sourceFilter, statusFilter, dateFrom, dateTo]);

  const hasFilters =
    searchQuery ||
    sourceFilter !== "all" ||
    statusFilter !== "all" ||
    dateFrom ||
    dateTo ||
    "";

  return {
    searchQuery,
    setSearchQuery,
    sourceFilter,
    setSourceFilter,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    filteredAndSortedVacancies,
    hasFilters: !!hasFilters,
  };
}
