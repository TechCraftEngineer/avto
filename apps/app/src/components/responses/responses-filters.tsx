"use client";

import { Input } from "@qbs-autonaim/ui/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@qbs-autonaim/ui/components/select";
import { Search } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

interface ResponsesFiltersProps {
  search: string;
  onSearchChange: Dispatch<SetStateAction<string>>;
  screeningFilter:
    | "all"
    | "evaluated"
    | "not-evaluated"
    | "high-score"
    | "low-score";
  onScreeningFilterChange: Dispatch<
    SetStateAction<
      "all" | "evaluated" | "not-evaluated" | "high-score" | "low-score"
    >
  >;
  sortField: string | null;
  onSortFieldChange: (field: string | null) => void;
}

export function ResponsesFilters({
  search,
  onSearchChange,
  screeningFilter,
  onScreeningFilterChange,
  sortField,
  onSortFieldChange,
}: ResponsesFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:min-w-[320px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Поиск по имени кандидата…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-background"
        />
      </div>

      <Select
        value={screeningFilter}
        onValueChange={(value) =>
          onScreeningFilterChange(
            value as
              | "all"
              | "evaluated"
              | "not-evaluated"
              | "high-score"
              | "low-score",
          )
        }
      >
        <SelectTrigger className="w-full sm:w-[200px] bg-background">
          <SelectValue placeholder="Фильтр по оценке" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все отклики</SelectItem>
          <SelectItem value="evaluated">Оценённые</SelectItem>
          <SelectItem value="not-evaluated">Не оценённые</SelectItem>
          <SelectItem value="high-score">Высокий балл</SelectItem>
          <SelectItem value="low-score">Низкий балл</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={sortField ?? "createdAt"}
        onValueChange={(value) =>
          onSortFieldChange(value === "createdAt" ? null : value)
        }
      >
        <SelectTrigger className="w-full sm:w-[200px] bg-background">
          <SelectValue placeholder="Сортировка" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="createdAt">По дате</SelectItem>
          <SelectItem value="score">По оценке</SelectItem>
          <SelectItem value="priorityScore">По приоритету</SelectItem>
          <SelectItem value="status">По статусу</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
