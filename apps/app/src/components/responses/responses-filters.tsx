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
import {
  IconAdjustments,
  IconAlertCircle,
  IconArrowsSort,
  IconFilter,
  IconSearch,
  IconSparkles,
  IconStar,
  IconStarOff,
  IconTag,
  IconX,
} from "@tabler/icons-react";
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
            placeholder="Найти кандидата по имени или вакансии..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 pl-9 pr-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <IconX className="size-4" />
            </button>
          )}
        </div>

        {/* Фильтр по скринингу */}
        <Select value={screeningFilter} onValueChange={onScreeningFilterChange}>
          <SelectTrigger className="h-10 w-full @xl/main:w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <IconFilter className="size-3.5" />
                Все отклики
              </div>
            </SelectItem>
            <SelectItem value="evaluated">
              <div className="flex items-center gap-2">
                <IconSparkles className="size-3.5" />
                Оценённые
              </div>
            </SelectItem>
            <SelectItem value="not-evaluated">
              <div className="flex items-center gap-2">
                <IconAlertCircle className="size-3.5" />
                Требуют оценки
              </div>
            </SelectItem>
            <SelectItem value="high-score">
              <div className="flex items-center gap-2">
                <IconStar className="size-3.5" />
                Перспективные (4+ балла)
              </div>
            </SelectItem>
            <SelectItem value="low-score">
              <div className="flex items-center gap-2">
                <IconStarOff className="size-3.5" />
                Низкий балл
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Кнопка расширенных фильтров */}
        <Button
          variant={showAdvanced ? "default" : "outline"}
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="h-10 gap-2"
        >
          <IconAdjustments className="size-4" />
          <span className="hidden sm:inline">Дополнительно</span>
        </Button>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-10 gap-2 text-muted-foreground hover:text-foreground"
          >
            <IconX className="size-4" />
            <span className="hidden sm:inline">Сбросить</span>
          </Button>
        )}
      </div>

      {/* Расширенные фильтры */}
      {showAdvanced && (
        <div className="flex flex-col gap-4 rounded-lg border bg-muted/30 p-4 animate-in slide-in-from-top-2">
          <div className="grid gap-4 @xl/main:grid-cols-2">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <IconTag className="size-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Статус отклика</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    value: "NEW",
                    label: "Новый",
                    color: "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20",
                  },
                  {
                    value: "EVALUATED",
                    label: "Оценён",
                    color:
                      "bg-purple-500/10 text-purple-700 hover:bg-purple-500/20",
                  },
                  {
                    value: "INTERVIEW",
                    label: "Интервью",
                    color:
                      "bg-green-500/10 text-green-700 hover:bg-green-500/20",
                  },
                  {
                    value: "COMPLETED",
                    label: "Завершён",
                    color: "bg-gray-500/10 text-gray-700 hover:bg-gray-500/20",
                  },
                  {
                    value: "SKIPPED",
                    label: "Пропущен",
                    color:
                      "bg-orange-500/10 text-orange-700 hover:bg-orange-500/20",
                  },
                ].map((status) => {
                  const isActive = statusFilter.includes(
                    status.value as
                      | "NEW"
                      | "EVALUATED"
                      | "INTERVIEW"
                      | "COMPLETED"
                      | "SKIPPED",
                  );
                  return (
                    <Button
                      key={status.value}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      className={!isActive ? status.color : ""}
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
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2">
                <IconArrowsSort className="size-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Сортировка</span>
              </div>
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
                  <SelectItem value="priorityScore">
                    По приоритету (рекомендуется)
                  </SelectItem>
                  <SelectItem value="status">По статусу</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-muted-foreground">
                Приоритет учитывает оценку, опыт и соответствие вакансии
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
