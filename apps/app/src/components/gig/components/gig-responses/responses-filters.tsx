"use client";

import {
  RESPONSE_STATUS,
  RESPONSE_STATUS_LABELS,
} from "@qbs-autonaim/db/schema";
import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@qbs-autonaim/ui";
import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import React from "react";
import type { ResponseFiltersState } from "./use-response-filters";

interface ResponsesFiltersProps {
  filters: ResponseFiltersState;
  onFiltersChange: (filters: ResponseFiltersState) => void;
  stats?: {
    priceMin: number;
    priceMax: number;
    scoreMin: number;
    scoreMax: number;
  };
}

export function ResponsesFilters({
  filters,
  onFiltersChange,
  stats,
}: ResponsesFiltersProps) {
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [priceMin, setPriceMin] = React.useState(
    filters.priceMin?.toString() ?? ""
  );
  const [priceMax, setPriceMax] = React.useState(
    filters.priceMax?.toString() ?? ""
  );
  const [dateFrom, setDateFrom] = React.useState(
    filters.dateFrom ? filters.dateFrom.toISOString().split("T")[0] : ""
  );
  const [dateTo, setDateTo] = React.useState(
    filters.dateTo ? filters.dateTo.toISOString().split("T")[0] : ""
  );
  const [scoreMin, setScoreMin] = React.useState(
    filters.scoreMin?.toString() ?? ""
  );
  const [scoreMax, setScoreMax] = React.useState(
    filters.scoreMax?.toString() ?? ""
  );

  const hasAdvancedFilters =
    filters.priceMin !== null ||
    filters.priceMax !== null ||
    filters.dateFrom !== null ||
    filters.dateTo !== null ||
    filters.scoreMin !== null ||
    filters.scoreMax !== null;

  const handleApplyAdvanced = () => {
    onFiltersChange({
      ...filters,
      priceMin: priceMin ? Number(priceMin) : null,
      priceMax: priceMax ? Number(priceMax) : null,
      dateFrom: dateFrom ? new Date(dateFrom) : null,
      dateTo: dateTo ? new Date(dateTo) : null,
      scoreMin: scoreMin ? Number(scoreMin) : null,
      scoreMax: scoreMax ? Number(scoreMax) : null,
    });
  };

  const handleClearFilters = () => {
    setPriceMin("");
    setPriceMax("");
    setDateFrom("");
    setDateTo("");
    setScoreMin("");
    setScoreMax("");
    onFiltersChange({
      searchQuery: filters.searchQuery,
      statusFilter: filters.statusFilter,
    });
  };

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, searchQuery: value });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, statusFilter: value });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Поиск по имени кандидата…"
              value={filters.searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 h-11 sm:h-10 text-base sm:text-sm border-muted-foreground/20 focus:border-primary transition-colors"
              style={{ fontSize: "16px" }}
            />
          </div>
        </div>

        {/* Status Filter */}
        <Select
          value={filters.statusFilter}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-full sm:w-48 h-11 sm:h-10 touch-manipulation border-muted-foreground/20 focus:border-primary transition-colors">
            <Filter className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="recommended">Рекомендованы</SelectItem>
            <SelectItem value="unprocessed">Необработанные</SelectItem>
            <SelectItem value={RESPONSE_STATUS.NEW}>
              {RESPONSE_STATUS_LABELS[RESPONSE_STATUS.NEW]}
            </SelectItem>
            <SelectItem value={RESPONSE_STATUS.EVALUATED}>
              {RESPONSE_STATUS_LABELS[RESPONSE_STATUS.EVALUATED]}
            </SelectItem>
            <SelectItem value={RESPONSE_STATUS.INTERVIEW}>
              {RESPONSE_STATUS_LABELS[RESPONSE_STATUS.INTERVIEW]}
            </SelectItem>
            <SelectItem value={RESPONSE_STATUS.NEGOTIATION}>
              {RESPONSE_STATUS_LABELS[RESPONSE_STATUS.NEGOTIATION]}
            </SelectItem>
            <SelectItem value={RESPONSE_STATUS.COMPLETED}>
              {RESPONSE_STATUS_LABELS[RESPONSE_STATUS.COMPLETED]}
            </SelectItem>
            <SelectItem value={RESPONSE_STATUS.SKIPPED}>
              {RESPONSE_STATUS_LABELS[RESPONSE_STATUS.SKIPPED]}
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters Toggle */}
        <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
          <PopoverTrigger asChild>
            <Button
              variant={hasAdvancedFilters ? "secondary" : "outline"}
              className="w-full sm:w-auto h-11 sm:h-10 gap-2 touch-manipulation"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Фильтры</span>
              {hasAdvancedFilters && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                 !
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Расширенные фильтры</h3>
                {hasAdvancedFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-8 text-muted-foreground"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Очистить
                  </Button>
                )}
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <label htmlFor="filter-price-min" className="text-sm font-medium">
                  Цена (₽)
                </label>
                <div className="flex gap-2">
                  <Input
                    id="filter-price-min"
                    type="number"
                    placeholder="От"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="h-9"
                    min={0}
                  />
                  <Input
                    type="number"
                    placeholder="До"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="h-9"
                    min={0}
                  />
                </div>
                {stats && stats.priceMax > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Доступно: {stats.priceMin.toLocaleString()} -{" "}
                    {stats.priceMax.toLocaleString()} ₽
                  </p>
                )}
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <label htmlFor="filter-date-from" className="text-sm font-medium">
                  Дата отклика
                </label>
                <div className="flex gap-2">
                  <Input
                    id="filter-date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-9"
                  />
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Score Range */}
              <div className="space-y-2">
                <label htmlFor="filter-score-min" className="text-sm font-medium">
                  Оценка скрининга (%)
                </label>
                <div className="flex gap-2">
                  <Input
                    id="filter-score-min"
                    type="number"
                    placeholder="От"
                    value={scoreMin}
                    onChange={(e) => setScoreMin(e.target.value)}
                    className="h-9"
                    min={0}
                    max={100}
                  />
                  <Input
                    type="number"
                    placeholder="До"
                    value={scoreMax}
                    onChange={(e) => setScoreMax(e.target.value)}
                    className="h-9"
                    min={0}
                    max={100}
                  />
                </div>
                {stats && stats.scoreMax > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Доступно: {stats.scoreMin} - {stats.scoreMax}%
                  </p>
                )}
              </div>

              <Button
                onClick={handleApplyAdvanced}
                className="w-full"
              >
                Применить фильтры
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {hasAdvancedFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.priceMin !== null && filters.priceMin !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
              Цена от {filters.priceMin.toLocaleString()} ₽
              <button
                type="button"
                onClick={() =>
                  onFiltersChange({ ...filters, priceMin: null })
                }
                className="hover:bg-secondary/80 rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.priceMax !== null && filters.priceMax !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
              Цена до {filters.priceMax.toLocaleString()} ₽
              <button
                type="button"
                onClick={() =>
                  onFiltersChange({ ...filters, priceMax: null })
                }
                className="hover:bg-secondary/80 rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.dateFrom !== null && filters.dateFrom !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
              С {filters.dateFrom.toLocaleDateString("ru-RU")}
              <button
                type="button"
                onClick={() =>
                  onFiltersChange({ ...filters, dateFrom: null })
                }
                className="hover:bg-secondary/80 rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.dateTo !== null && filters.dateTo !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
              По {filters.dateTo.toLocaleDateString("ru-RU")}
              <button
                type="button"
                onClick={() =>
                  onFiltersChange({ ...filters, dateTo: null })
                }
                className="hover:bg-secondary/80 rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.scoreMin !== null && filters.scoreMin !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
              Оценка от {filters.scoreMin}%
              <button
                type="button"
                onClick={() =>
                  onFiltersChange({ ...filters, scoreMin: null })
                }
                className="hover:bg-secondary/80 rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.scoreMax !== null && filters.scoreMax !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
              Оценка до {filters.scoreMax}%
              <button
                type="button"
                onClick={() =>
                  onFiltersChange({ ...filters, scoreMax: null })
                }
                className="hover:bg-secondary/80 rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
