"use client";

import { Badge } from "@qbs-autonaim/ui/components/badge";
import { Button } from "@qbs-autonaim/ui/components/button";
import { Calendar } from "@qbs-autonaim/ui/components/calendar";
import { Checkbox } from "@qbs-autonaim/ui/components/checkbox";
import { Input } from "@qbs-autonaim/ui/components/input";
import { Label } from "@qbs-autonaim/ui/components/label";
import {
  Popover,
  PopoverContent,
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
      workspaceId: workspace?.id ?? "",
      limit: 100,
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
    <div className="flex flex-col gap-3 p-3 sm:p-4 bg-card rounded-lg border shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3 flex-1">
          {/* Поиск */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени, email, телефону…"
              className="pl-9 h-10 bg-background"
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              aria-label="Поиск кандидатов"
              type="search"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <Separator orientation="vertical" className="hidden sm:block h-8" />

          {/* Фильтр по вакансии */}
          <Select
            value={filters.vacancyId ?? "all"}
            onValueChange={handleVacancyChange}
          >
            <SelectTrigger className="w-full sm:w-[200px] h-10 gap-2 bg-background">
              <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
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
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-10 px-4">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Фильтры</span>
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 px-1.5 py-0.5 h-5 text-[10px] min-w-5 justify-center text-foreground font-semibold"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Фильтры</h4>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                      onClick={onReset}
                    >
                      Сбросить все
                    </Button>
                  )}
                </div>

                {/* Статус */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Статус</Label>
                  <div className="space-y-2">
                    {(
                      ["ACTIVE", "BLACKLISTED", "HIRED"] as CandidateStatus[]
                    ).map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={filters.status.includes(status)}
                          onCheckedChange={() => handleStatusToggle(status)}
                        />
                        <Label
                          htmlFor={`status-${status}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {CANDIDATE_STATUS_LABELS[status]}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Дата последней активности */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Последняя активность
                  </Label>
                  <div className="flex flex-col gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start text-left font-normal h-9"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
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
                          className="justify-start text-left font-normal h-9"
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {filters.lastActivityTo
                            ? filters.lastActivityTo.toLocaleDateString("ru-RU")
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
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Кнопка сброса */}
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 px-3"
              onClick={onReset}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
