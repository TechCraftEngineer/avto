import { Input } from "@qbs-autonaim/ui/components/input";
import { Search } from "lucide-react";
import type { ResponseStatusFilterUI } from "../hooks/use-response-table";
import type { ScreeningFilter } from "../types";
import { ResponseFilters } from "./response-filters";
import { ResponseStatusFilter } from "./response-status-filter";

interface ResponseSearchFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  screeningFilter: ScreeningFilter;
  onFilterChange: (filter: ScreeningFilter) => void;
  statusFilter: ResponseStatusFilterUI[];
  onStatusFilterChange: (statuses: ResponseStatusFilterUI[]) => void;
}

export function ResponseSearchFilter({
  search,
  onSearchChange,
  screeningFilter,
  onFilterChange,
  statusFilter,
  onStatusFilterChange,
}: ResponseSearchFilterProps) {
  return (
    <div className="flex flex-1 flex-wrap items-center gap-2 min-w-0">
      <div className="relative w-full min-w-[140px] md:w-62.5 md:min-w-62.5">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-9 w-full bg-background/60 border-border/60 hover:bg-background/80 focus-visible:bg-background transition-colors"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ResponseFilters
          selectedFilter={screeningFilter}
          onFilterChange={onFilterChange}
        />
        <ResponseStatusFilter
          selectedStatuses={statusFilter}
          onStatusChange={onStatusFilterChange}
        />
      </div>
    </div>
  );
}
