"use client";

import {
  RESPONSE_STATUS,
  RESPONSE_STATUS_LABELS,
} from "@qbs-autonaim/db/schema";
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@qbs-autonaim/ui";
import { Filter, Search } from "lucide-react";

interface ResponsesFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export function ResponsesFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: ResponsesFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Поиск по имени кандидата…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-11 sm:h-10 text-base sm:text-sm border-muted-foreground/20 focus:border-primary transition-colors"
            style={{ fontSize: "16px" }}
          />
        </div>
      </div>

      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-full sm:w-48 h-11 sm:h-10 touch-manipulation border-muted-foreground/20 focus:border-primary transition-colors">
          <Filter className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
          <SelectValue placeholder="Статус" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все статусы</SelectItem>
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
    </div>
  );
}
