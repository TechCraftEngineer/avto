"use client";

import { Badge } from "@qbs-autonaim/ui/components/badge";
import { Button } from "@qbs-autonaim/ui/components/button";
import { Calendar } from "@qbs-autonaim/ui/components/calendar";
import { Checkbox } from "@qbs-autonaim/ui/components/checkbox";
import {
  Field,
  FieldContent,
  FieldTitle,
} from "@qbs-autonaim/ui/components/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@qbs-autonaim/ui/components/input-group";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@qbs-autonaim/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@qbs-autonaim/ui/components/select";
import { Separator } from "@qbs-autonaim/ui/components/separator";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, CalendarDays, Filter, Search, X } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useORPC } from "~/orpc/react";
import type {
  CandidateStatus,
  CandidateFilters as TCandidateFilters,
} from "../../types/types";
import { CANDIDATE_STATUS_LABELS } from "../../types/types";

interface CandidateFiltersProps {
  filters: TCandidateFilters;
  onFiltersChange: (filters: TCandidateFilters) => void;
  onReset: () => void;
}

export function CandidateFilters({
  filters,
  onFiltersChange,
  onReset,
}: CandidateFiltersProps) {
  const { workspace } = useWorkspaceContext();
  const orpc = useORPC();

  // Получаем список активных вакансий воркспейса (лимит 100 для выбора в фильтре)
  const { data: vacanciesData } = useQuery({
    ...orpc.vacancy.listActive.queryOptions({
      input: { workspaceId: workspace?.id ?? "", limit: 100 },
    }),
    enabled: !!workspace?.id,
  });

  const vacancies = useMemo(() => {
    return vacanciesData ?? [];
  }, [vacanciesData]);

  const handleSearchChange = useCallback(
    (value: string) => {
      onFiltersChange({ ...filters, search: value });
    },
    [filters, onFiltersChange],
  );

  const handleStatusToggle = useCallback(
    (status: CandidateStatus) => {
      const newStatus = filters.status.includes(status)
        ? filters.status.filter((s) => s !== status)
        : [...filters.status, status];
      onFiltersChange({ ...filters, status: newStatus });
    },
    [filters, onFiltersChange],
  );

  const handleVacancyChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        vacancyId: value === "all" ? undefined : value,
      });
    },
    [filters, onFiltersChange],
  );

  const handleDateChange = useCallback(
    (field: "lastActivityFrom" | "lastActivityTo", date: Date | undefined) => {
      onFiltersChange({ ...filters, [field]: date });
    },
    [filters, onFiltersChange],
  );

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status.length > 0) count++;
    if (filters.vacancyId) count++;
    if (filters.skills.length > 0) count++;
    if (filters.lastActivityFrom || filters.lastActivityTo) count++;
    return count;
  }, [filters]);

  return (
    <div className="border-input bg-card flex flex-col gap-3 rounded-md border p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
          {/* Поиск */}
          <InputGroup className="max-w-md flex-1">
            <InputGroupAddon align="inline-start">
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Поиск по имени, email, телефону…"
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              aria-label="Поиск кандидатов"
              type="search"
              autoComplete="off"
              spellCheck={false}
            />
          </InputGroup>

          <Separator
            orientation="vertical"
            className="border-border hidden h-8 shrink-0 sm:block"
          />

          {/* Фильтр по вакансии */}
          <Select
            value={filters.vacancyId ?? "all"}
            onValueChange={handleVacancyChange}
          >
            <SelectTrigger className="h-9 w-full gap-2 sm:w-[200px]">
              <Briefcase className="size-4 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Все вакансии" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все вакансии</SelectItem>
              {vacancies.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Кнопка фильтров */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 px-3 has-data-[slot=badge]:pr-2"
              >
                <Filter className="size-4" />
                <span className="hidden sm:inline">Фильтры</span>
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="rounded-md px-1.5 py-0 font-medium"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="end">
              <PopoverHeader className="flex-row items-center justify-between gap-2 border-b border-border px-4 py-3">
                <PopoverTitle className="text-sm font-medium">
                  Фильтры
                </PopoverTitle>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto px-0 py-0 text-xs text-muted-foreground hover:text-foreground"
                    onClick={onReset}
                  >
                    Сбросить все
                  </Button>
                )}
              </PopoverHeader>
              <div className="p-4 space-y-4">
                {/* Статус */}
                <Field>
                  <FieldTitle>Статус</FieldTitle>
                  <FieldContent>
                    <div className="flex flex-col gap-2">
                      {(
                        ["ACTIVE", "BLACKLISTED", "HIRED"] as CandidateStatus[]
                      ).map((status) => (
                        <label
                          key={status}
                          htmlFor={`status-${status}`}
                          className="hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-2 pl-1.5 -ml-1.5 -mr-1"
                        >
                          <Checkbox
                            id={`status-${status}`}
                            checked={filters.status.includes(status)}
                            onCheckedChange={() => handleStatusToggle(status)}
                          />
                          <span className="text-sm">
                            {CANDIDATE_STATUS_LABELS[status]}
                          </span>
                        </label>
                      ))}
                    </div>
                  </FieldContent>
                </Field>

                <Separator />

                {/* Дата последней активности */}
                <Field>
                  <FieldTitle>Последняя активность</FieldTitle>
                  <FieldContent>
                    <div className="flex flex-col gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-full justify-start font-normal"
                          >
                            <Calendar className="mr-2 size-4 shrink-0" />
                            {filters.lastActivityFrom
                              ? filters.lastActivityFrom.toLocaleDateString(
                                  "ru-RU",
                                )
                              : "От"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={filters.lastActivityFrom}
                            onSelect={(date) =>
                              handleDateChange("lastActivityFrom", date)
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-full justify-start font-normal"
                          >
                            <CalendarDays className="mr-2 size-4 shrink-0" />
                            {filters.lastActivityTo
                              ? filters.lastActivityTo.toLocaleDateString(
                                  "ru-RU",
                                )
                              : "До"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={filters.lastActivityTo}
                            onSelect={(date) =>
                              handleDateChange("lastActivityTo", date)
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </FieldContent>
                </Field>
              </div>
            </PopoverContent>
          </Popover>

          {/* Кнопка сброса */}
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-9"
              onClick={onReset}
              aria-label="Сбросить фильтры"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
