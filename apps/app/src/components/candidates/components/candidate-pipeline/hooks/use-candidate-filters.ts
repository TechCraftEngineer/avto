// Simple stub hook for candidate filters
import { useState } from "react";

export function useCandidateFilters() {
  const [selectedVacancy, setSelectedVacancy] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch] = useState(searchText); // Simple implementation

  const filterStages = [];
  const toggleStageFilter = () => {};
  const clearStageFilters = () => {};

  return {
    selectedVacancy,
    setSelectedVacancy,
    searchText,
    setSearchText,
    debouncedSearch,
    filterStages,
    toggleStageFilter,
    clearStageFilters,
  };
}