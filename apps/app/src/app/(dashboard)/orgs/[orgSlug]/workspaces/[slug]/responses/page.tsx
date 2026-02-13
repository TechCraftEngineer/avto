"use client";

import { Button } from "@qbs-autonaim/ui/button";
import {
  IconFilter,
  IconLayoutKanban,
  IconSparkles,
  IconTable,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { use, useState } from "react";
import { PageHeader } from "~/components/layout";
import {
  ResponsesFilters,
  ResponsesKanban,
  ResponsesStats,
  ResponsesTable,
  VacancyFilter,
} from "~/components/responses";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

interface ResponsesPageProps {
  params: Promise<{ orgSlug: string; slug: string }>;
}

type ViewMode = "table" | "board";

export default function ResponsesPage({ params }: ResponsesPageProps) {
  const { orgSlug, slug: workspaceSlug } = use(params);
  const trpc = useTRPC();
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
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | "high" | "medium" | "low"
  >("all");

  const [selectedVacancyIds, setSelectedVacancyIds] = useQueryState(
    "vacancies",
    parseAsArrayOf(parseAsString).withDefault([]),
  );

  const { data: vacanciesData } = useQuery({
    ...trpc.vacancy.listActive.queryOptions({
      workspaceId: workspace?.id ?? "",
      limit: 100,
    }),
    enabled: Boolean(workspace?.id),
  });

  const { data: responsesData, isLoading } = useQuery({
    ...trpc.vacancy.responses.listWorkspace.queryOptions({
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

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Отклики"
        description="Управление откликами кандидатов на ваши вакансии"
        tooltipContent={`Здесь отображаются все отклики на ваши вакансии. Вы можете фильтровать их по статусу, оценке скрининга и другим параметрам.\n\n[Подробнее в документации](${process.env.NEXT_PUBLIC_DOCS_URL}/responses)`}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border bg-background p-1">
            <Button
              onClick={() => setViewMode("board")}
              variant={viewMode === "board" ? "default" : "ghost"}
              size="sm"
              className="h-8 gap-2"
            >
              <IconLayoutKanban className="size-4" />
              <span className="hidden sm:inline">Доска</span>
            </Button>
            <Button
              onClick={() => setViewMode("table")}
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              className="h-8 gap-2"
            >
              <IconTable className="size-4" />
              <span className="hidden sm:inline">Таблица</span>
            </Button>
          </div>
        </div>
      </PageHeader>

      <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 px-4 py-6 md:px-6">
        <ResponsesStats
          totalResponses={stats.totalResponses}
          evaluatedResponses={stats.evaluatedResponses}
          highScoreResponses={stats.highScoreResponses}
          interviewResponses={stats.interviewResponses}
          isLoading={isLoading}
        />

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Быстрые фильтры:
          </span>
          {quickFilters.map((filter) => (
            <Button
              key={filter.label}
              variant={filter.active ? "default" : "outline"}
              size="sm"
              onClick={filter.onClick}
              className="h-8 gap-2 transition-all"
            >
              <filter.icon className="size-3.5" />
              {filter.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row gap-3">
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
            <>
              <ResponsesTable
                responses={responsesData?.responses ?? []}
                isLoading={isLoading}
                orgSlug={orgSlug}
                workspaceSlug={workspaceSlug}
                sortField={sortField}
                onSortChange={handleSort}
                hasFilters={
                  search.trim() !== "" ||
                  screeningFilter !== "all" ||
                  statusFilter.length > 0
                }
              />

              {responsesData && responsesData.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Назад
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Страница {page} из {responsesData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) => Math.min(responsesData.totalPages, p + 1))
                    }
                    disabled={page === responsesData.totalPages}
                  >
                    Вперёд
                  </Button>
                </div>
              )}
            </>
          ) : (
            <ResponsesKanban
              responses={responsesData?.responses ?? []}
              isLoading={isLoading}
              orgSlug={orgSlug}
              workspaceSlug={workspaceSlug}
            />
          )}
        </div>
      </div>
    </div>
  );
}
