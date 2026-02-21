import { useMemo, useState } from "react";
import type { VacancyListItem } from "~/types/vacancy";

export function useVacancyFilters(vacancies: VacancyListItem[] | undefined) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "createdAt" | "title" | "responses" | "newResponses"
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

    // Сортировка: сначала по статусу избранного, затем по активности, затем по выбранному полю
    filtered.sort((a, b) => {
      // Сначала сортируем по статусу избранного: избранные (true) должны быть выше
      if (a.isFavorite !== b.isFavorite) {
        return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0);
      }

      // Затем сортируем по статусу: активные (true) должны быть выше архивных (false)
      if (a.isActive !== b.isActive) {
        return (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0);
      }

      // Затем сортируем по выбранному полю
      let comparison = 0;
      switch (sortBy) {
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "responses":
          comparison = (a.totalResponsesCount || 0) - (b.totalResponsesCount || 0);
          break;
        case "newResponses":
          comparison = (a.newResponses || 0) - (b.newResponses || 0);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [vacancies, searchQuery, sourceFilter, statusFilter, dateFrom, dateTo, sortBy, sortOrder]);

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
