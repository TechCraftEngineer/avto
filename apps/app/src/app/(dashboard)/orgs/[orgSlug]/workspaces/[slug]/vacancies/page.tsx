"use client";

import { Button } from "@qbs-autonaim/ui/button";
import { IconDownload, IconPlus } from "@tabler/icons-react";
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "~/components/layout";
import {
  DeleteVacancyDialog,
  VacancyFilters,
  VacancyInsights,
  VacancyStats,
  VacancyTable,
} from "~/components/vacancies/components";
import { useVacanciesStats } from "~/hooks/use-vacancies-stats";
import { useVacancyFilters } from "~/hooks/use-vacancy-filters";
import { useWorkspace } from "~/hooks/use-workspace";
import { useWorkspaceParams } from "~/hooks/use-workspace-params";
import { env } from "~/env";
import { useTRPC } from "~/trpc/react";

export default function VacanciesPage() {
  const { orgSlug, slug: workspaceSlug } = useWorkspaceParams();
  const trpc = useTRPC();
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vacancyToDelete, setVacancyToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [sortBy, setSortBy] = useState<
    "createdAt" | "title" | "views" | "responses" | "newResponses"
  >("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data: vacancies, isLoading } = useQuery(
    trpc.freelancePlatforms.getVacancies.queryOptions(
      workspace?.id
        ? {
            workspaceId: workspace.id,
            sortBy,
            sortOrder,
          }
        : skipToken,
    ),
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

  const stats = useVacanciesStats(vacancies);

  const deleteVacancyMutation = useMutation({
    ...trpc.freelancePlatforms.deleteVacancy.mutationOptions(),
    onSuccess: async () => {
      toast.success("Вакансия успешно удалена");
      setDeleteDialogOpen(false);
      setVacancyToDelete(null);
      await queryClient.invalidateQueries({
        queryKey: trpc.freelancePlatforms.getVacancies.queryKey(),
      });
    },
    onError: (error) => {
      toast.error(error.message || "Не удалось удалить вакансию");
    },
  });

  const handleDeleteOpen = (vacancyId: string, vacancyTitle: string) => {
    setVacancyToDelete({ id: vacancyId, title: vacancyTitle });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!workspace?.id || !vacancyToDelete) return;
    deleteVacancyMutation.mutate({
      workspaceId: workspace.id,
      vacancyId: vacancyToDelete.id,
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
        tooltipContent={`Вы можете импортировать вакансии из HH, Avito и других площадок. Система будет автоматически отслеживать новые отклики и синхронизировать статусы.\n\n[Подробнее в документации](${env.NEXT_PUBLIC_DOCS_URL}/integrations/hh)`}
      >
        <div className="flex items-center gap-2">
          <Button asChild className="h-9 gap-2 shadow-sm active:scale-95">
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
            asChild
            variant="outline"
            className="h-9 gap-2 shadow-sm active:scale-95"
          >
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/create`}
              title="Создать новую вакансию вручную"
            >
              <IconPlus className="size-4" />
              <span className="hidden sm:inline">Создать вручную</span>
              <span className="sm:hidden">Создать</span>
            </Link>
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
            </div>
          </div>

          <VacancyTable
            vacancies={filteredAndSortedVacancies}
            isLoading={isLoading}
            orgSlug={orgSlug ?? ""}
            workspaceSlug={workspaceSlug ?? ""}
            workspaceId={workspace?.id}
            hasFilters={hasFilters}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleTableSort}
            onDeleteOpen={handleDeleteOpen}
          />
        </div>
      </div>

      <DeleteVacancyDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        vacancyTitle={vacancyToDelete?.title ?? ""}
        isLoading={deleteVacancyMutation.isPending}
      />
    </div>
  );
}
