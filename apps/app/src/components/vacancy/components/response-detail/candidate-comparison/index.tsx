"use client";

import { Button } from "@qbs-autonaim/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@qbs-autonaim/ui";
import { Table, TableBody } from "@qbs-autonaim/ui";
import { GitCompare } from "lucide-react";
import { useMemo, useState } from "react";
import type { VacancyResponse } from "../types";
import { ComparisonTableHeader } from "./comparison-table-header";
import { ComparisonTableRow } from "./comparison-table-row";
import { StatusFilter } from "./status-filter";
import type { SortDirection, SortField } from "./types";
import { useCandidatesData } from "./use-candidates-data";

interface CandidateComparisonModalProps {
  currentResponse: VacancyResponse;
  vacancyId: string;
}

export function CandidateComparisonModal({
  currentResponse,
  vacancyId,
}: CandidateComparisonModalProps) {
  const [sortField, setSortField] = useState<SortField>("matchScore");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { candidates, isLoading } = useCandidatesData({
    vacancyId,
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedAndFilteredCandidates = useMemo(() => {
    let filtered = candidates;

    if (statusFilter) {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    return [...filtered].sort((a, b) => {
      let aValue: number | string = 0;
      let bValue: number | string = 0;

      switch (sortField) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "matchScore":
          aValue = a.matchScore;
          bValue = b.matchScore;
          break;
        case "salary":
          aValue = a.salary ?? 0;
          bValue = b.salary ?? 0;
          break;
        case "responseTime":
          aValue = a.responseTime;
          bValue = b.responseTime;
          break;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
  }, [candidates, sortField, sortDirection, statusFilter]);

  const uniqueStatuses = Array.from(new Set(candidates.map((c) => c.status)));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <GitCompare className="h-4 w-4" />
          Сравнить кандидатов
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-fit max-w-[95vw] w-full max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <GitCompare className="h-6 w-6" />
              Сравнение кандидатов
            </DialogTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Всего: {sortedAndFilteredCandidates.length}
              </span>
            </div>
          </div>
        </DialogHeader>

        <StatusFilter
          statusFilter={statusFilter}
          uniqueStatuses={uniqueStatuses}
          onFilterChange={setStatusFilter}
        />

        <div className="flex-1 overflow-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Загрузка...</div>
            </div>
          ) : sortedAndFilteredCandidates.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">
                Нет кандидатов для отображения
              </div>
            </div>
          ) : (
            <Table>
              <ComparisonTableHeader
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <TableBody>
                {sortedAndFilteredCandidates.map((candidate) => (
                  <ComparisonTableRow
                    key={candidate.id}
                    candidate={candidate}
                    isCurrentCandidate={candidate.id === currentResponse.id}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-muted/30">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Подсказка</p>
              <p className="text-sm text-muted-foreground">
                Нажмите на заголовки колонок для сортировки. Текущий кандидат
                выделен синей полосой и звездочкой. Используйте фильтры по
                статусу для быстрого поиска нужных кандидатов.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
