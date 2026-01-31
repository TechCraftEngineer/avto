"use client";

import { Button } from "@qbs-autonaim/ui";
import {
  IconDownload,
  IconFilter,
  IconRefresh,
  IconSparkles,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { use, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "~/components/layout";
import {
  ResponsesFilters,
  ResponsesStats,
  ResponsesTable,
} from "~/components/responses";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

interface ResponsesPageProps {
  params: Promise<{ orgSlug: string; slug: string }>;
}

export default function ResponsesPage({ params }: ResponsesPageProps) {
  const { orgSlug, slug: workspaceSlug } = use(params);
  const trpc = useTRPC();
  const { workspace } = useWorkspace();

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

  // Получаем отклики для всего workspace
  const { data: responsesData, isLoading } = useQuery({
    ...trpc.vacancy.responses.listAllWorkspace.queryOptions({
      workspaceId: workspace?.id ?? "",
      page,
      limit: 50,
      sortField,
      sortDirection,
      screeningFilter,
      statusFilter: statusFilter.length > 0 ? statusFilter : undefined,
      search: search.trim() || undefined,
    }),
    enabled: Boolean(workspace?.id),
  });

  // Подсчитываем статистику
  const stats = {
    totalResponses: responsesData?.total ?? 0,
    evaluatedResponses:
      responsesData?.responses.filter((r) => r.screening !== null).length ?? 0,
    highScoreResponses:
      responsesData?.responses.filter(
        (r) => r.screening && r.screening.score >= 4,
      ).length ?? 0,
    interviewResponses:
      responsesData?.responses.filter((r) => r.interviewSession !== null)
        .length ?? 0,
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

  const handleRefresh = () => {
    toast.success("Данные обновлены");
  };

  const handleExport = () => {
    if (!responsesData?.responses.length) {
      toast.error("Нет данных для экспорта");
      return;
    }

    const csvContent = [
      ["Кандидат", "Оценка", "Приоритет", "Статус", "Дата отклика"].join(","),
      ...responsesData.responses.map((r) =>
        [
          r.candidateName || "Без имени",
          r.screening?.score || "—",
          r.priorityScore || "—",
          r.status,
          r.respondedAt
            ? new Date(r.respondedAt).toLocaleDateString("ru-RU")
            : "—",
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const today = new Date().toISOString().split("T")[0];
    link.download = `отклики_${today}.csv`;
    link.click();
    toast.success("Данные экспортированы");
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
        tooltipContent="Здесь отображаются все отклики на ваши вакансии. Вы можете фильтровать их по статусу, оценке скрининга и другим параметрам."
      >
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExport}
            disabled={isLoading || !responsesData?.responses.length}
            variant="outline"
            className="hidden h-9 items-center gap-2 px-4 font-medium transition-all hover:bg-muted active:scale-95 sm:flex"
          >
            <IconDownload className="size-4" />
            Экспорт
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            variant="outline"
            className="h-9 items-center gap-2 px-4 font-medium transition-all hover:bg-muted active:scale-95"
          >
            <IconRefresh
              className={`size-4 ${isLoading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Обновить</span>
          </Button>
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

        {/* Быстрые фильтры */}
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
          <ResponsesFilters
            search={search}
            onSearchChange={setSearch}
            screeningFilter={screeningFilter}
            onScreeningFilterChange={setScreeningFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
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

          <ResponsesTable
            responses={responsesData?.responses ?? []}
            isLoading={isLoading}
            orgSlug={orgSlug}
            workspaceSlug={workspaceSlug}
            sortField={sortField}
            sortDirection={sortDirection}
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
        </div>
      </div>
    </div>
  );
}
