"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useORPC } from "~/orpc/react";
import {
  CandidateCard,
  CandidateFilters,
  CandidateProfileDialog,
  CandidatesTable,
  ViewSwitcher,
} from "./components";
import type {
  CandidateStatus,
  GlobalCandidate,
  SortField,
  SortOrder,
  CandidateFilters as TCandidateFilters,
  ViewMode,
} from "./types/types";

const DEFAULT_FILTERS: TCandidateFilters = {
  search: "",
  status: [],
  vacancyId: undefined,
  skills: [],
  lastActivityFrom: undefined,
  lastActivityTo: undefined,
};

const DEFAULT_SORT = {
  field: "updatedAt" as SortField,
  order: "desc" as SortOrder,
};

export function GlobalCandidatesView() {
  const { workspace } = useWorkspaceContext();
  const orpc = useORPC();
  const queryClient = useQueryClient();

  const organizationId = workspace?.organizationId;

  // Состояния
  const [filters, setFilters] = useState<TCandidateFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [view, setView] = useState<ViewMode>("table");
  const [selectedCandidate, setSelectedCandidate] =
    useState<GlobalCandidate | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Дебаунс поиска
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Запрос списка кандидатов
  const { data: candidatesData, isLoading } = useQuery({
    ...orpc.globalCandidates.list.queryOptions({
      organizationId: organizationId ?? "",
      search: debouncedSearch || undefined,
      status: filters.status.length > 0 ? filters.status : undefined,
      vacancyId: filters.vacancyId,
      skills: filters.skills.length > 0 ? filters.skills : undefined,
      lastActivityFrom: filters.lastActivityFrom,
      lastActivityTo: filters.lastActivityTo,
      sortBy: sort.field,
      sortOrder: sort.order,
      limit: 100,
    }),
    enabled: !!organizationId,
  });

  // Мутация для обновления статуса
  const statusMutation = useMutation(
    orpc.globalCandidates.updateStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.globalCandidates.list.queryKey(),
        });
      },
    }),
  );

  const candidates = useMemo(() => {
    return candidatesData?.items ?? [];
  }, [candidatesData]);

  // Обработчики
  const handleFiltersChange = useCallback((newFilters: TCandidateFilters) => {
    setFilters(newFilters);
  }, []);

  const handleFiltersReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const handleSort = useCallback(
    (newSort: { field: SortField; order: SortOrder }) => {
      setSort(newSort);
    },
    [],
  );

  const handleViewChange = useCallback((newView: ViewMode) => {
    setView(newView);
  }, []);

  const handleCandidateClick = useCallback((candidate: GlobalCandidate) => {
    setSelectedCandidate(candidate);
    setIsProfileOpen(true);
  }, []);

  const handleStatusChange = useCallback(
    (candidateId: string, status: CandidateStatus) => {
      if (organizationId) {
        statusMutation.mutate({
          candidateId,
          organizationId,
          status,
        });
      }
    },
    [organizationId, statusMutation],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Фильтры и переключатель вида */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CandidateFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={handleFiltersReset}
            />
          </div>
          <div className="hidden sm:block">
            <ViewSwitcher view={view} onViewChange={handleViewChange} />
          </div>
        </div>

        {/* Информация о количестве */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {candidatesData?.total !== undefined && (
              <>
                Найдено:{" "}
                <span className="font-medium">{candidatesData.total}</span>{" "}
                кандидатов
              </>
            )}
          </p>
        </div>
      </div>

      {/* Отображение кандидатов */}
      {view === "table" ? (
        <CandidatesTable
          candidates={candidates}
          onRowClick={handleCandidateClick}
          onStatusChange={handleStatusChange}
          isLoading={isLoading}
          sort={sort}
          onSort={handleSort}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : candidates.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                Кандидаты не найдены
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Попробуйте изменить параметры поиска или фильтры
              </p>
            </div>
          ) : (
            candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onViewProfile={handleCandidateClick}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </div>
      )}

      {/* Диалог профиля */}
      <CandidateProfileDialog
        candidate={selectedCandidate}
        open={isProfileOpen}
        onOpenChange={(open) => {
          setIsProfileOpen(open);
          if (!open) setSelectedCandidate(null);
        }}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
