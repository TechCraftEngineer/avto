"use client";

import {
  Button,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@qbs-autonaim/ui";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import Link from "next/link";
import { env } from "~/env";
import { VacancyTableRow } from "./vacancy-table-row";

interface Vacancy {
  id: string;
  title: string;
  source: string;
  region: string | null;
  views: number | null;
  totalResponsesCount: number | null;
  newResponses: number | null;
  resumesInProgress: number | null;
  isActive: boolean | null;
}

interface VacancyTableProps {
  vacancies: Vacancy[];
  isLoading: boolean;
  orgSlug: string;
  workspaceSlug: string;
  workspaceId: string | undefined;
  allVacancies: Vacancy[];
  mergeOpenVacancyId: string | null;
  mergeTargetVacancyId: string;
  onMergeOpen: (vacancyId: string) => void;
  onMergeClose: () => void;
  onMergeTargetChange: (vacancyId: string) => void;
  onMergeConfirm: (sourceId: string, targetId: string) => void;
  isMerging: boolean;
  hasFilters: boolean;
}

export function VacancyTable({
  vacancies,
  isLoading,
  orgSlug,
  workspaceSlug,
  workspaceId,
  allVacancies,
  mergeOpenVacancyId,
  mergeTargetVacancyId,
  onMergeOpen,
  onMergeClose,
  onMergeTargetChange,
  onMergeConfirm,
  isMerging,
  hasFilters,
  sortBy,
  sortOrder,
  onSortChange,
}: VacancyTableProps & {
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (
    field: "createdAt" | "title" | "views" | "responses" | "newResponses",
  ) => void;
}) {
  const handleSort = (
    field: "createdAt" | "title" | "views" | "responses" | "newResponses",
  ) => {
    onSortChange(field);
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card shadow-sm">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent">
            {/* Headers... */}
            <TableHead className="w-[280px] font-semibold text-foreground">
              Название вакансии
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Площадка
            </TableHead>
            <TableHead className="hidden font-semibold text-foreground md:table-cell">
              Регион
            </TableHead>
            <TableHead
              className="text-right font-semibold text-foreground"
              aria-sort={
                sortBy === "responses"
                  ? sortOrder === "asc"
                    ? "ascending"
                    : "descending"
                  : "none"
              }
            >
              <button
                type="button"
                onClick={() => handleSort("responses")}
                className="inline-flex items-center gap-1 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                title="Общее количество откликов на вакансию"
              >
                Всего откликов
                {renderSortIcon("responses")}
              </button>
            </TableHead>
            <TableHead
              className="text-right font-semibold text-foreground"
              aria-sort={
                sortBy === "newResponses"
                  ? sortOrder === "asc"
                    ? "ascending"
                    : "descending"
                  : "none"
              }
            >
              <button
                type="button"
                onClick={() => handleSort("newResponses")}
                className="inline-flex items-center gap-1 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                title="Новые отклики, требующие внимания"
              >
                Новые
                {renderSortIcon("newResponses")}
              </button>
            </TableHead>
            <TableHead className="hidden text-right font-semibold text-foreground md:table-cell">
              <span title="Кандидаты в процессе рассмотрения">В обработке</span>
            </TableHead>
            <TableHead className="hidden text-right font-semibold text-foreground lg:table-cell">
              <span title="Количество просмотров вакансии на площадке">
                Просмотры
              </span>
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Статус
            </TableHead>
            <TableHead className="text-right font-semibold text-foreground">
              Действия
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-5 w-[220px]" />
                    <Skeleton className="h-4 w-[120px]" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-[100px] rounded-full" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-5 w-[80px]" />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-end gap-1">
                    <Skeleton className="h-5 w-[40px]" />
                    <Skeleton className="h-3 w-[60px]" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-[50px] ml-auto rounded-full" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-col items-end gap-1">
                    <Skeleton className="h-5 w-[30px]" />
                    <Skeleton className="h-3 w-[40px]" />
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Skeleton className="h-5 w-[50px] ml-auto" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-[80px]" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-8 w-8 ml-auto rounded-full" />
                </TableCell>
              </TableRow>
            ))
          ) : vacancies.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-[500px] p-0">
                <div className="flex h-full flex-col items-center justify-center gap-6 px-4 py-10">
                  {/* Анимированный список скелетонов */}
                  <div className="animate-fade-in h-36 w-full max-w-64 overflow-hidden px-4 mask-[linear-gradient(transparent,black_10%,black_90%,transparent)]">
                    <div
                      className="animate-infinite-scroll-y flex flex-col animation-duration-[10s]"
                      style={{ "--scroll": "-50%" } as React.CSSProperties}
                    >
                      {Array.from({ length: 8 }).map((_, index) => (
                        <div
                          key={`empty-skeleton-${index}`}
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

                  {/* Текстовое содержимое */}
                  <div className="max-w-sm text-pretty text-center">
                    <span className="text-base font-medium text-foreground">
                      {hasFilters ? "Ничего не найдено" : "Нет вакансий"}
                    </span>
                    <div className="mt-2 text-pretty text-sm text-muted-foreground">
                      {hasFilters
                        ? "Попробуйте изменить параметры поиска или сбросить фильтры"
                        : "Создайте первую вакансию или настройте автоматическую загрузку из подключенных источников"}
                    </div>
                  </div>

                  {/* Кнопки действий */}
                  {!hasFilters && (
                    <div className="flex items-center gap-2">
                      <Button asChild className="h-10 gap-2">
                        <Link
                          href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/new`}
                        >
                          <IconPlus className="size-4" />
                          Создать вакансию
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="h-10">
                        <Link
                          href={`${env.NEXT_PUBLIC_DOCS_URL}/vacancies`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Узнать больше
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            vacancies.map((vacancy) => (
              <VacancyTableRow
                key={vacancy.id}
                vacancy={vacancy}
                orgSlug={orgSlug}
                workspaceSlug={workspaceSlug}
                workspaceId={workspaceId}
                allVacancies={allVacancies}
                mergeOpenVacancyId={mergeOpenVacancyId}
                mergeTargetVacancyId={mergeTargetVacancyId}
                onMergeOpen={onMergeOpen}
                onMergeClose={onMergeClose}
                onMergeTargetChange={onMergeTargetChange}
                onMergeConfirm={onMergeConfirm}
                isMerging={isMerging}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
