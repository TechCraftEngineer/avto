import { useState } from "react";
import type { ScreeningFilter } from "~/components/response";
import { useDebounce } from "~/hooks/use-debounce";
import type { SortDirection, SortField } from "./types";

export type ResponseStatusFilter =
  | "NEW"
  | "EVALUATED"
  | "INTERVIEW"
  | "COMPLETED"
  | "SKIPPED";

// Тип для UI компонента, который включает NEGOTIATION
export type ResponseStatusFilterUI = ResponseStatusFilter | "NEGOTIATION";

export function useResponseTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [screeningFilter, setScreeningFilter] =
    useState<ScreeningFilter>("all");
  const [statusFilter, setStatusFilter] = useState<ResponseStatusFilterUI[]>(
    [],
  );
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);

  // Фильтруем NEGOTIATION для API запроса
  const apiStatusFilter = statusFilter.filter(
    (s): s is ResponseStatusFilter => s !== "NEGOTIATION",
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setCurrentPage(1);
  };

  return {
    currentPage,
    setCurrentPage,
    sortField,
    sortDirection,
    handleSort,
    selectedIds,
    setSelectedIds,
    screeningFilter,
    setScreeningFilter,
    statusFilter,
    apiStatusFilter,
    setStatusFilter,
    searchInput,
    debouncedSearch,
    handleSearchChange,
    handleSelectOne,
  };
}
