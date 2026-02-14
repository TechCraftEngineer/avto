import { Button } from "@qbs-autonaim/ui";
import type { ScreeningFilter } from "../types";

interface ResponseFiltersProps {
  selectedFilter: ScreeningFilter;
  onFilterChange: (filter: ScreeningFilter) => void;
}

const filters: Array<{ value: ScreeningFilter; label: string }> = [
  { value: "all", label: "Все" },
  { value: "evaluated", label: "Оценены" },
  { value: "not-evaluated", label: "Не оценены" },
  { value: "high-score", label: "Высокий балл" },
  { value: "low-score", label: "Низкий балл" },
];

export function ResponseFilters({
  selectedFilter,
  onFilterChange,
}: ResponseFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={selectedFilter === filter.value ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(filter.value)}
          className="h-9"
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
