"use client";

import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@qbs-autonaim/ui";
import { IconFilter, IconSearch, IconX } from "@tabler/icons-react";
import { useState } from "react";

interface ResponsesFiltersProps {
  search: string;
  onSearchChange: (search: string) => void;
  screeningFilter:
    | "all"
    | "evaluated"
    | "not-evaluated"
    | "high-score"
    | "low-score";
  onScreeningFilterChange: (
    filter: "all" | "evaluated" | "not-evaluated" | "high-score" | "low-score",
  ) => void;
  statusFilter: Array<
    "NEW" | "EVALUATED" | "INTERVIEW" | "COMPLETED" | "SKIPPED"
  >;
  onStatusFilterChange: (
    statuses: Array<
      "NEW" | "EVALUATED" | "INTERVIEW" | "COMPLETED" | "SKIPPED"
    >,
  ) => void;
  sortField: string | null;
  onSortFieldChange: (field: string | null) => void;
}

export function ResponsesFilters({
  search,
  onSearchChange,
  screeningFilter,
  onScreeningFilterChange,
  statusFilter,
  onStatusFilterChange,
  sortField,
  onSortFieldChange,
}: ResponsesFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasFilters =
    search !== "" || screeningFilter !== "all" || statusFilter.length > 0;

  const handleClearFilters = () => {
    onSearchChange("");
    onScreeningFilterChange("all");
    onStatusFilterChange([]);
    onSortFieldChange(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 @xl/main:flex-row">
        {/* Поиск */}
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени кандидата..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 pl-9 pr-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <IconX className="size-4" />
            </button>
          )}
        </div>

        {/* Фильтр по скринингу */}
        <Select value={screeningFilter} onValueChange={onScreeningFilterChange}>
          <SelectTrigger className="h-10 w-full @xl/main:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все отклики</SelectItem>
            <SelectItem value="evaluated">Оценённые</SelectItem>
            <SelectItem value="not-evaluated">Не оценённые</SelectItem>
            <SelectItem value="high-score">Высокий балл</SelectItem>
            <SelectItem value="low-score">Низкий балл</SelectItem>
          </SelectContent>
        </Select>

        {/* Кнопка расширенных фильтров */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="h-10 gap-2"
        >
          <IconFilter className="size-4" />
          Фильтры
        </Button>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-10 gap-2"
          >
            <IconX className="size-4" />
            Сбросить
          </Button>
        )}
      </div>

      {/* Расширенные фильтры */}
      {showAdvanced && (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 @xl/main:flex-row">
          <div className="flex-1">
            <span className="mb-2 block text-sm font-medium">
              Статус отклика
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "NEW", label: "Новый" },
                { value: "EVALUATED", label: "Оценён" },
                { value: "INTERVIEW", label: "Интервью" },
                { value: "COMPLETED", label: "Завершён" },
                { value: "SKIPPED", label: "Пропущен" },
              ].map((status) => (
                <Button
                  key={status.value}
                  variant={
                    statusFilter.includes(
                      status.value as
                        | "NEW"
                        | "EVALUATED"
                        | "INTERVIEW"
                        | "COMPLETED"
                        | "SKIPPED",
                    )
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => {
                    const statusValue = status.value as
                      | "NEW"
                      | "EVALUATED"
                      | "INTERVIEW"
                      | "COMPLETED"
                      | "SKIPPED";
                    if (statusFilter.includes(statusValue)) {
                      onStatusFilterChange(
                        statusFilter.filter((s) => s !== statusValue),
                      );
                    } else {
                      onStatusFilterChange([...statusFilter, statusValue]);
                    }
                  }}
                >
                  {status.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <span className="mb-2 block text-sm font-medium">Сортировка</span>
            <Select
              value={sortField ?? "createdAt"}
              onValueChange={(value) =>
                onSortFieldChange(value === "createdAt" ? null : value)
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">По дате создания</SelectItem>
                <SelectItem value="respondedAt">По дате отклика</SelectItem>
                <SelectItem value="score">По общему баллу</SelectItem>
                <SelectItem value="detailedScore">
                  По детальному баллу
                </SelectItem>
                <SelectItem value="priorityScore">По приоритету</SelectItem>
                <SelectItem value="status">По статусу</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
