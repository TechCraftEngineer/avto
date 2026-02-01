"use client";

import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@qbs-autonaim/ui";
import {
  IconInbox,
  IconSearch,
  IconSparkles,
  IconStar,
} from "@tabler/icons-react";
import { ResponsesTableRow } from "./responses-table-row";

interface Response {
  id: string;
  candidateName: string | null;
  status: string;
  hrSelectionStatus: string | null;
  respondedAt: Date | null;
  createdAt: Date;
  screening: {
    score: number;
    detailedScore: number;
  } | null;
  interviewScoring: {
    score: number;
    detailedScore: number;
  } | null;
  priorityScore: number;
}

interface ResponsesTableProps {
  responses: Response[];
  isLoading: boolean;
  orgSlug: string;
  workspaceSlug: string;
  sortField: string | null;
  sortDirection: "asc" | "desc";
  onSortChange: (
    field:
      | "createdAt"
      | "score"
      | "detailedScore"
      | "potentialScore"
      | "careerTrajectoryScore"
      | "priorityScore"
      | "status"
      | "respondedAt",
  ) => void;
  hasFilters: boolean;
}

export function ResponsesTable({
  responses,
  isLoading,
  orgSlug,
  workspaceSlug,
  sortField,
  sortDirection,
  onSortChange,
  hasFilters,
}: ResponsesTableProps) {
  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card shadow-sm">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[250px] font-semibold text-foreground">
              Кандидат
            </TableHead>
            <TableHead
              className="cursor-pointer font-semibold text-foreground hover:text-primary"
              onClick={() => onSortChange("score")}
            >
              <button
                type="button"
                className="inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Оценка
                {renderSortIcon("score")}
              </button>
            </TableHead>
            <TableHead
              className="cursor-pointer font-semibold text-foreground hover:text-primary"
              onClick={() => onSortChange("priorityScore")}
            >
              <button
                type="button"
                className="inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Приоритет
                {renderSortIcon("priorityScore")}
              </button>
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Статус
            </TableHead>
            <TableHead
              className="cursor-pointer font-semibold text-foreground hover:text-primary"
              onClick={() => onSortChange("respondedAt")}
            >
              <button
                type="button"
                className="inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Дата отклика
                {renderSortIcon("respondedAt")}
              </button>
            </TableHead>
            <TableHead className="text-right font-semibold text-foreground">
              Действия
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 10 }, (_, i) => i).map((id) => (
              <TableRow key={`skeleton-${id}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-full" />
                    <Skeleton className="h-5 w-[150px]" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-[60px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-[60px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-[80px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-[100px]" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="ml-auto h-8 w-8 rounded-full" />
                </TableCell>
              </TableRow>
            ))
          ) : responses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-[500px] p-0">
                <div className="flex h-full flex-col items-center justify-center gap-6 px-4 py-10">
                  {hasFilters ? (
                    <>
                      <div className="animate-fade-in h-36 w-full max-w-64 overflow-hidden px-4 mask-[linear-gradient(transparent,black_10%,black_90%,transparent)]">
                        <div
                          className="animate-infinite-scroll-y flex flex-col animation-duration-[10s]"
                          style={{ "--scroll": "-50%" } as React.CSSProperties}
                        >
                          {Array.from({ length: 8 }, (_, i) => i).map((id) => (
                            <div
                              key={`skeleton-empty-${id}`}
                              className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm"
                            >
                              <IconSearch className="size-4 text-muted-foreground" />
                              <div className="h-2.5 w-24 min-w-0 rounded-sm bg-muted" />
                              <div className="hidden grow items-center justify-end gap-1.5 text-muted-foreground xs:flex">
                                <div className="size-3.5 rounded-full bg-muted" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="max-w-md text-pretty text-center">
                        <div className="mb-4 flex justify-center">
                          <div className="rounded-full bg-muted p-4">
                            <IconSearch className="size-8 text-muted-foreground" />
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">
                          Ничего не найдено
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Попробуйте изменить параметры поиска или сбросить
                          фильтры, чтобы увидеть больше откликов
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-4 flex justify-center">
                        <div className="rounded-full bg-linear-to-br from-blue-500/10 to-purple-500/10 p-6">
                          <IconInbox className="size-12 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="max-w-md text-pretty text-center">
                        <h3 className="text-lg font-semibold text-foreground">
                          Пока нет откликов
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Отклики появятся здесь, когда кандидаты начнут
                          откликаться на ваши вакансии
                        </p>
                      </div>
                      <div className="mt-4 grid gap-3 text-left text-sm">
                        <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
                          <IconSparkles className="mt-0.5 size-5 shrink-0 text-purple-600" />
                          <div>
                            <p className="font-medium">Автоматическая оценка</p>
                            <p className="text-xs text-muted-foreground">
                              Каждый отклик автоматически оценивается по
                              релевантности
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
                          <IconStar className="mt-0.5 size-5 shrink-0 text-amber-600" />
                          <div>
                            <p className="font-medium">Приоритизация</p>
                            <p className="text-xs text-muted-foreground">
                              Лучшие кандидаты выделяются для быстрого отбора
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            responses.map((response) => (
              <ResponsesTableRow
                key={response.id}
                response={response}
                orgSlug={orgSlug}
                workspaceSlug={workspaceSlug}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
