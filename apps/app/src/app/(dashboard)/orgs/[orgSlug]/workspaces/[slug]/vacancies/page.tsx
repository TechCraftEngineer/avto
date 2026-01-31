"use client";

import { Button } from "@qbs-autonaim/ui";
import { IconDownload, IconPlus, IconRefresh } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { triggerUpdateVacancies } from "~/actions/trigger";
import { PageHeader } from "~/components/layout";
import {
  VacancyFilters,
  VacancyInsights,
  VacancyStats,
  VacancyTable,
} from "~/components/vacancies";
import { useVacancyFilters } from "~/hooks/use-vacancy-filters";
import { useVacancyStats } from "~/hooks/use-vacancy-stats";
import { useWorkspace } from "~/hooks/use-workspace";
import { useWorkspaceParams } from "~/hooks/use-workspace-params";
import { useTRPC } from "~/trpc/react";

export default function VacanciesPage() {
  const { orgSlug, slug: workspaceSlug } = useWorkspaceParams();
  const trpc = useTRPC();
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [mergeOpenVacancyId, setMergeOpenVacancyId] = useState<string | null>(
    null,
  );
  const [mergeTargetVacancyId, setMergeTargetVacancyId] = useState<string>("");
  const [sortBy, setSortBy] = useState<
    "createdAt" | "title" | "views" | "responses" | "newResponses"
  >("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data: vacancies, isLoading } = useQuery(
    trpc.freelancePlatforms.getVacancies.queryOptions({
      workspaceId: workspace?.id ?? "",
      sortBy,
      sortOrder,
    }),
  );

  const {
    searchQuery,
    setSearchQuery,
    sourceFilter,
    setSourceFilter,
    statusFilter,
    setStatusFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    filteredAndSortedVacancies,
    hasFilters,
  } = useVacancyFilters(vacancies);

  const stats = useVacancyStats(vacancies);

  const mergeVacanciesMutation = useMutation(
    trpc.freelancePlatforms.mergeVacancies.mutationOptions({
      onSuccess: async () => {
        toast.success("Вакансии успешно объединены");
        setMergeOpenVacancyId(null);
        setMergeTargetVacancyId("");
        await queryClient.invalidateQueries({
          queryKey: trpc.freelancePlatforms.getVacancies.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(error.message || "Не удалось объединить вакансии");
      },
    }),
  );

  const handleUpdate = async () => {
    if (!workspace?.id) {
      toast.error("Рабочее пространство не найдено");
      return;
    }

    setIsUpdating(true);
    try {
      const result = await triggerUpdateVacancies(workspace.id);
      if (result.success) {
        toast.success("Запущена синхронизация с источниками");
      } else {
        toast.error("Ошибка при запуске обновления");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMergeConfirm = (sourceId: string, targetId: string) => {
    if (!workspace?.id) return;
    mergeVacanciesMutation.mutate({
      workspaceId: workspace.id,
      sourceVacancyId: sourceId,
      targetVacancyId: targetId,
    });
  };

  const handleTableSort = (
    field: "createdAt" | "title" | "views" | "responses" | "newResponses",
  ) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Вакансии"
        description="Управление вашими вакансиями и откликами на фриланс-платформах"
        tooltipContent="Вы можете импортировать вакансии из HH, Avito и других площадок. Система будет автоматически отслеживать новые отклики и синхронизировать статусы."
      >
        <div className="flex items-center gap-2">
          <Button asChild className="h-9 gap-2 shadow-sm active:scale-95">
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/create`}
              title="Создать новую вакансию вручную"
            >
              <IconPlus className="size-4" />
              <span className="hidden sm:inline">Создать вакансию</span>
              <span className="sm:hidden">Создать</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-9 gap-2 shadow-sm active:scale-95"
          >
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/import`}
              title="Импортировать вакансии с HH.ru, Avito и других платформ"
            >
              <IconDownload className="size-4" />
              <span className="hidden sm:inline">Добавить с HH/Avito</span>
              <span className="sm:hidden">Импорт</span>
            </Link>
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={isUpdating || isLoading}
            variant="outline"
            className="h-9 items-center gap-2 px-3 font-medium transition-all hover:bg-muted active:scale-95 sm:px-4"
            title="Получить новые отклики со всех подключенных платформ"
            aria-label={isUpdating ? "Обновление откликов" : "Обновить отклики"}
          >
            <IconRefresh
              className={`size-4 ${isUpdating ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">
              {isUpdating ? "Обновление…" : "Обновить отклики"}
            </span>
            <span className="sm:hidden">{isUpdating ? "…" : "Обновить"}</span>
          </Button>
        </div>
      </PageHeader>

      <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-8 px-4 py-6 md:px-6">
        <VacancyStats
          totalVacancies={stats.totalVacancies}
          activeVacancies={stats.activeVacancies}
          totalResponses={stats.totalResponses}
          newResponses={stats.newResponses}
          isLoading={isLoading}
        />

        {/* Умные подсказки для рекрутера */}
        {!isLoading && vacancies && vacancies.length > 0 && (
          <VacancyInsights
            totalVacancies={stats.totalVacancies}
            activeVacancies={stats.activeVacancies}
            totalResponses={stats.totalResponses}
            newResponses={stats.newResponses}
            avgResponsesPerVacancy={
              stats.activeVacancies > 0
                ? Math.round(stats.totalResponses / stats.activeVacancies)
                : 0
            }
          />
        )}

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4">
            <VacancyFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sourceFilter={sourceFilter}
              onSourceChange={setSourceFilter}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
              dateFrom={dateFrom}
              onDateFromChange={setDateFrom}
              dateTo={dateTo}
              onDateToChange={setDateTo}
            />

            <div className="flex items-center justify-between px-1">
              {!isLoading && (
                <div className="text-sm text-muted-foreground transition-all animate-in fade-in slide-in-from-left-2">
                  {hasFilters ? (
                    <>
                      Найдено{" "}
                      <span className="font-semibold text-foreground">
                        {filteredAndSortedVacancies.length}
                      </span>{" "}
                      из{" "}
                      <span className="font-semibold text-foreground">
                        {vacancies?.length ?? 0}
                      </span>{" "}
                      вакансий
                    </>
                  ) : (
                    <>
                      Всего вакансий:{" "}
                      <span className="font-semibold text-foreground">
                        {vacancies?.length ?? 0}
                      </span>
                    </>
                  )}
                </div>
              )}
              {isUpdating && (
                <div className="flex items-center gap-2 text-sm font-medium text-primary animate-pulse">
                  <IconRefresh className="size-3.5 animate-spin" />
                  Обновление данных...
                </div>
              )}
            </div>
          </div>

          <VacancyTable
            vacancies={filteredAndSortedVacancies}
            isLoading={isLoading}
            orgSlug={orgSlug ?? ""}
            workspaceSlug={workspaceSlug ?? ""}
            workspaceId={workspace?.id}
            allVacancies={vacancies ?? []}
            mergeOpenVacancyId={mergeOpenVacancyId}
            mergeTargetVacancyId={mergeTargetVacancyId}
            onMergeOpen={setMergeOpenVacancyId}
            onMergeClose={() => {
              setMergeOpenVacancyId(null);
              setMergeTargetVacancyId("");
            }}
            onMergeTargetChange={setMergeTargetVacancyId}
            onMergeConfirm={handleMergeConfirm}
            isMerging={mergeVacanciesMutation.isPending}
            hasFilters={hasFilters}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleTableSort}
          />
        </div>
      </div>
    </div>
  );
}
