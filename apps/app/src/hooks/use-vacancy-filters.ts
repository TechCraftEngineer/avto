/**
 * Тонкий хук для управления состоянием фильтров вакансий.
 * Вся фильтрация и сортировка выполняется на сервере (getVacancies).
 */

import type { SortDirection } from "@qbs-autonaim/shared";
import { useState, useCallback } from "react";

export type VacancyFiltersState = {
  searchQuery: string;
  sourceFilter: string; // "all" | HH | FL_RU | ...
  statusFilter: "all" | "active" | "inactive";
  sortBy: "createdAt" | "title" | "responses" | "newResponses";
  sortOrder: SortDirection;
  dateFrom: string;
  dateTo: string;
  page: number;
};

const DEFAULT_FILTERS: VacancyFiltersState = {
  searchQuery: "",
  sourceFilter: "all",
  statusFilter: "all",
  sortBy: "createdAt",
  sortOrder: "desc",
  dateFrom: "",
  dateTo: "",
  page: 1,
};

export function useVacancyFilters() {
  const [filters, setFilters] = useState<VacancyFiltersState>(DEFAULT_FILTERS);

  const setSearchQuery = useCallback((v: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: v, page: 1 }));
  }, []);
  const setSourceFilter = useCallback((v: string) => {
    setFilters((prev) => ({ ...prev, sourceFilter: v, page: 1 }));
  }, []);
  const setStatusFilter = useCallback((v: "all" | "active" | "inactive") => {
    setFilters((prev) => ({ ...prev, statusFilter: v, page: 1 }));
  }, []);
  const setSortBy = useCallback(
    (v: "createdAt" | "title" | "responses" | "newResponses") => {
      setFilters((prev) => ({ ...prev, sortBy: v, page: 1 }));
    },
    [],
  );
  const setSortOrder = useCallback((v: SortDirection) => {
    setFilters((prev) => ({ ...prev, sortOrder: v, page: 1 }));
  }, []);
  const setDateFrom = useCallback((v: string) => {
    setFilters((prev) => ({ ...prev, dateFrom: v, page: 1 }));
  }, []);
  const setDateTo = useCallback((v: string) => {
    setFilters((prev) => ({ ...prev, dateTo: v, page: 1 }));
  }, []);
  const setPage = useCallback((v: number) => {
    setFilters((prev) => ({ ...prev, page: v }));
  }, []);

  const hasFilters =
    filters.searchQuery ||
    filters.sourceFilter !== "all" ||
    filters.statusFilter !== "all" ||
    filters.dateFrom ||
    filters.dateTo;

  return {
    filters,
    searchQuery: filters.searchQuery,
    setSearchQuery,
    sourceFilter: filters.sourceFilter,
    setSourceFilter,
    statusFilter: filters.statusFilter,
    setStatusFilter,
    sortBy: filters.sortBy,
    setSortBy,
    sortOrder: filters.sortOrder,
    setSortOrder,
    dateFrom: filters.dateFrom,
    setDateFrom,
    dateTo: filters.dateTo,
    setDateTo,
    page: filters.page,
    setPage,
    hasFilters: !!hasFilters,
  };
}
