"use client";

import type { SortDirection } from "@qbs-autonaim/shared";
import { Button } from "@qbs-autonaim/ui/components/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@qbs-autonaim/ui/components/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@qbs-autonaim/ui/components/select";
import { IconArrowDown, IconArrowUp } from "@tabler/icons-react";
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
  sortDirection: SortDirection;
  onSortFieldChange: (field: string | null) => void;
  onSortDirectionChange: Dispatch<SetStateAction<SortDirection>>;
}

export function ResponsesFilters({
  search,
  onSearchChange,
  screeningFilter,
  onScreeningFilterChange,
  sortField,
  sortDirection,
  onSortFieldChange,
  onSortDirectionChange,
}: ResponsesFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <InputGroup className="flex-1 sm:min-w-[320px]">
        <InputGroupAddon>
          <Search className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Поиск по имени кандидата…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </InputGroup>

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
        <SelectTrigger className="w-full sm:w-[200px]">
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

      <div className="flex items-center gap-1">
        <Select
          value={sortField ?? "createdAt"}
          onValueChange={(value) =>
            onSortFieldChange(value === "createdAt" ? null : value)
          }
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Сортировка" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">По дате</SelectItem>
            <SelectItem value="score">По оценке</SelectItem>
            <SelectItem value="priorityScore">По приоритету</SelectItem>
            <SelectItem value="status">По статусу</SelectItem>
          </SelectContent>
        </Select>
        {sortField != null && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() =>
              onSortDirectionChange(sortDirection === "asc" ? "desc" : "asc")
            }
            aria-label={
              sortDirection === "asc"
                ? "По возрастанию (нажмите для убывания)"
                : "По убыванию (нажмите для возрастания)"
            }
          >
            {sortDirection === "asc" ? (
              <IconArrowUp className="size-4" />
            ) : (
              <IconArrowDown className="size-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
