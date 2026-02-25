"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import { Input } from "@qbs-autonaim/ui/components/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@qbs-autonaim/ui/components/input-group";
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
import { ArrowUpDown, Calendar, Filter, RotateCcw, Search } from "lucide-react";

interface VacancyFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sourceFilter: string;
  onSourceChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  sortBy: string;
  onSortChange: (
    value: "createdAt" | "title" | "responses" | "newResponses",
  ) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
}

export function VacancyFilters({
  searchQuery,
  onSearchChange,
  sourceFilter,
  onSourceChange,
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}: VacancyFiltersProps) {
  const hasFilters =
    searchQuery ||
    sourceFilter !== "all" ||
    statusFilter !== "all" ||
    dateFrom ||
    dateTo;

  const handleReset = () => {
    onSearchChange("");
    onSourceChange("all");
    onStatusChange("all");
    onDateFromChange("");
    onDateToChange("");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <InputGroup className="flex-1 md:max-w-md bg-background">
          <InputGroupAddon>
            <Search className="size-4" aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            placeholder="Поиск по названию или региону…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Поиск вакансий"
          />
        </InputGroup>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={sourceFilter} onValueChange={onSourceChange}>
            <SelectTrigger
              className="w-full sm:w-[160px] bg-background"
              aria-label="Фильтр по источнику"
            >
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Источник" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все источники</SelectItem>
              <SelectItem value="HH">HeadHunter</SelectItem>
              <SelectItem value="FL_RU">FL.ru</SelectItem>
              <SelectItem value="FREELANCE_RU">Freelance.ru</SelectItem>
              <SelectItem value="AVITO">Avito</SelectItem>
              <SelectItem value="SUPERJOB">SuperJob</SelectItem>
              <SelectItem value="HABR">Хабр Карьера</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger
              className="w-full sm:w-[140px] bg-background"
              aria-label="Фильтр по статусу"
            >
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="active">Активные</SelectItem>
              <SelectItem value="inactive">Неактивные</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start sm:w-[180px] bg-background"
                aria-label="Фильтр по дате"
              >
                <Calendar className="mr-2 size-4 shrink-0" aria-hidden />
                {dateFrom || dateTo ? (
                  <span className="truncate text-xs">
                    {dateFrom && new Date(dateFrom).toLocaleDateString("ru-RU")}
                    {dateFrom && dateTo && " - "}
                    {dateTo && new Date(dateTo).toLocaleDateString("ru-RU")}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Диапазон дат</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-4" align="start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="date-from"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    C&nbsp;даты
                  </label>
                  <Input
                    id="date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => onDateFromChange(e.target.value)}
                    max={dateTo || undefined}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="date-to"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    По&nbsp;дату
                  </label>
                  <Input
                    id="date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => onDateToChange(e.target.value)}
                    min={dateFrom || undefined}
                    className="bg-background"
                  />
                </div>
                {(dateFrom || dateTo) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      onDateFromChange("");
                      onDateToChange("");
                    }}
                  >
                    Сбросить даты
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger
              className="w-full sm:w-[170px] bg-background"
              aria-label="Сортировка"
            >
              <div className="flex items-center gap-2">
                <ArrowUpDown className="size-4 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Сортировка" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">По дате создания</SelectItem>
              <SelectItem value="responses">По числу откликов</SelectItem>
              <SelectItem value="newResponses">По новым откликам</SelectItem>
              <SelectItem value="title">По алфавиту</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-4 shrink-0" />
              Сбросить
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
