"use client";

import type { SortDirection } from "@qbs-autonaim/shared";
import { Card, CardContent } from "@qbs-autonaim/ui/components/card";
import { Pagination } from "@qbs-autonaim/ui/components/pagination";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@qbs-autonaim/ui/components/toggle-group";
import { cn } from "@qbs-autonaim/ui/utils";
import {
  IconFilter,
  IconLayoutKanban,
  IconSparkles,
  IconTable,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { PageHeader } from "~/components/layout";
import {
  ResponsesFilters,
  ResponsesKanban,
  ResponsesStats,
  ResponsesTable,
  VacancyFilter,
} from "~/components/responses";
import { env } from "~/env";
import { useWorkspace } from "~/hooks/use-workspace";
import { useWorkspaceParams } from "~/hooks/use-workspace-params";
import { useORPC } from "~/orpc/react";

type ViewMode = "table" | "board";

export default function ResponsesPage() {
  const { orgSlug, slug: workspaceSlug } = useWorkspaceParams();
  const orpc = useORPC();
  const { workspace } = useWorkspace();

  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [screeningFilter, setScreeningFilter] = useState<
    "all" | "evaluated" | "not-evaluated" | "high-score" | "low-score"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    Array<"NEW" | "EVALUATED" | "INTERVIEW" | "COMPLETED" | "SKIPPED">
  >([]);
  const [sortField, setSortField] = useState<
    | "createdAt"
    | "score"
    | "detailedScore"
    | "potentialScore"
    | "careerTrajectoryScore"
    | "priorityScore"
    | "status"
    | "respondedAt"
    | null
  >(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | "high" | "medium" | "low"
  >("all");

  const [selectedVacancyIds, setSelectedVacancyIds] = useQueryState(
    "vacancies",
    parseAsArrayOf(parseAsString).withDefault([]),
  );

  const { data: vacanciesData } = useQuery({
    ...orpc.vacancy.listActive.queryOptions({
      input: { workspaceId: workspace?.id ?? "", limit: 100 },
    }),
    enabled: Boolean(workspace?.id),
  });

  const { data: responsesData, isLoading } = useQuery({
    ...orpc.vacancy.responses.listWorkspace.queryOptions({
      input: {
        workspaceId: workspace?.id ?? "",
        page: viewMode === "board" ? 1 : page,
        limit: viewMode === "board" ? 50 : 50,
        sortField,
        sortDirection,
        screeningFilter,
        statusFilter: statusFilter.length > 0 ? statusFilter : undefined,
        vacancyIds:
          selectedVacancyIds.length > 0 ? selectedVacancyIds : undefined,
        search: search.trim() || undefined,
      },
    }),
    enabled: Boolean(workspace?.id),
  });

  const stats = {
    totalResponses: responsesData?.total ?? 0,
    evaluatedResponses:
      responsesData?.responses.filter(
        (r: { screening: unknown }) => r.screening !== null,
      ).length ?? 0,
    highScoreResponses:
      responsesData?.responses.filter(
        (r) =>
          r.screening !== null &&
          r.screening.score !== null &&
          r.screening.score >= 4,
      ).length ?? 0,
    interviewResponses:
      responsesData?.responses.filter(
        (r: { interviewSession: unknown }) => r.interviewSession !== null,
      ).length ?? 0,
  };

  const handleSort = (
    field:
      | "createdAt"
      | "score"
      | "detailedScore"
      | "potentialScore"
      | "careerTrajectoryScore"
      | "priorityScore"
      | "status"
      | "respondedAt",
  ) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const quickFilters = [
    {
      label: "Требуют внимания",
      icon: IconSparkles,
      active: screeningFilter === "high-score" && statusFilter.includes("NEW"),
      onClick: () => {
        setScreeningFilter("high-score");
        setStatusFilter(["NEW"]);
        setPriorityFilter("all");
      },
    },
    {
      label: "Высокий приоритет",
      icon: IconFilter,
      active: priorityFilter === "high",
      onClick: () => {
        setPriorityFilter("high");
        setScreeningFilter("all");
      },
    },
    {
      label: "Не оценённые",
      icon: IconFilter,
      active: screeningFilter === "not-evaluated",
      onClick: () => {
        setScreeningFilter("not-evaluated");
        setStatusFilter([]);
        setPriorityFilter("all");
      },
    },
  ];

  const activeQuickFilter = quickFilters.find((f) => f.active)?.label;
  const handleQuickFilterChange = (v: string | undefined) => {
    if (!v) {
      setScreeningFilter("all");
      setStatusFilter([]);
      setPriorityFilter("all");
      return;
    }
    quickFilters.find((f) => f.label === v)?.onClick();
  };

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Отклики"
        description="Управление откликами кандидатов на ваши вакансии"
        tooltipContent={`Здесь отображаются все отклики на ваши вакансии. Вы можете фильтровать их по статусу, оценке скрининга и другим параметрам.\n\n[Подробнее в документации](${env.NEXT_PUBLIC_DOCS_URL}/candidates/pipeline)`}
      >
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(v) => v && setViewMode(v as ViewMode)}
          variant="outline"
          size="sm"
          className="rounded-lg"
        >
          <ToggleGroupItem value="board" aria-label="Доска">
            <IconLayoutKanban className="size-4" />
            <span className="hidden sm:inline">Доска</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Таблица">
            <IconTable className="size-4" />
            <span className="hidden sm:inline">Таблица</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </PageHeader>

      <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 px-4 py-6 md:px-6">
        <ResponsesStats
          totalResponses={stats.totalResponses}
          evaluatedResponses={stats.evaluatedResponses}
          highScoreResponses={stats.highScoreResponses}
          interviewResponses={stats.interviewResponses}
          isLoading={isLoading}
        />

        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Быстрые фильтры:
              </span>
              <ToggleGroup
                type="single"
                value={activeQuickFilter}
                onValueChange={handleQuickFilterChange}
                variant="outline"
                size="sm"
                className="flex-wrap"
              >
                {quickFilters.map((filter) => (
                  <ToggleGroupItem key={filter.label} value={filter.label}>
                    <filter.icon className="size-3.5" />
                    {filter.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </CardContent>
        </Card>

        <div
          className={cn(
            "flex flex-col gap-5",
            viewMode === "board" && "min-h-0 flex-1",
          )}
        >
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <VacancyFilter
                  vacancies={(vacanciesData ?? []).map((v) => ({
                    id: v.id,
                    title: v.title,
                  }))}
                  selectedVacancyIds={selectedVacancyIds}
                  onSelectionChange={setSelectedVacancyIds}
                  isLoading={!vacanciesData}
                />
                <ResponsesFilters
                  search={search}
                  onSearchChange={setSearch}
                  screeningFilter={screeningFilter}
                  onScreeningFilterChange={setScreeningFilter}
                  sortField={sortField}
                  onSortFieldChange={(field) => {
                    if (field === null || field === "createdAt") {
                      setSortField(null);
                    } else if (
                      field === "score" ||
                      field === "detailedScore" ||
                      field === "potentialScore" ||
                      field === "careerTrajectoryScore" ||
                      field === "priorityScore" ||
                      field === "status" ||
                      field === "respondedAt"
                    ) {
                      setSortField(field);
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between px-1">
            {!isLoading && responsesData && (
              <div className="text-sm text-muted-foreground transition-all animate-in fade-in slide-in-from-left-2">
                Найдено{" "}
                <span className="font-semibold text-foreground">
                  {responsesData.total}
                </span>{" "}
                откликов
              </div>
            )}
          </div>

          {viewMode === "table" ? (
            <Card
              className="flex min-h-0 flex-1 flex-col overflow-hidden border-border bg-card shadow-sm"
              style={{ minHeight: "calc(100dvh - 320px)" }}
            >
              <CardContent className="flex flex-1 flex-col gap-4 overflow-auto p-4">
                <ResponsesTable
                  responses={responsesData?.responses ?? []}
                  isLoading={isLoading}
                  orgSlug={orgSlug ?? ""}
                  workspaceSlug={workspaceSlug ?? ""}
                  sortField={sortField}
                  onSortChange={handleSort}
                  hasFilters={
                    search.trim() !== "" ||
                    screeningFilter !== "all" ||
                    statusFilter.length > 0
                  }
                />

                {responsesData && responsesData.totalPages > 1 && (
                  <Pagination
                    currentPage={page}
                    totalPages={responsesData.totalPages}
                    onPageChange={setPage}
                  />
                )}
              </CardContent>
            </Card>
          ) : (
            <Card
              className="kanban-page flex min-h-0 flex-1 flex-col overflow-hidden border-border bg-card shadow-sm"
              style={{ minHeight: "calc(100dvh - 320px)" }}
            >
              <CardContent className="flex flex-1 flex-col overflow-hidden p-4">
                <ResponsesKanban
                  responses={responsesData?.responses ?? []}
                  isLoading={isLoading}
                  orgSlug={orgSlug ?? ""}
                  workspaceSlug={workspaceSlug ?? ""}
                  workspaceId={workspace?.id ?? ""}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
