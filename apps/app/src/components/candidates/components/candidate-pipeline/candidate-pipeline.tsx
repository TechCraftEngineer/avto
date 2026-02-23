"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CandidatesTable,
  type ColumnVisibility,
  ColumnVisibilityToggle,
  PipelineBoardView,
  PipelineToolbar,
  PipelineViewSwitcher,
} from "~/components";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useORPC } from "~/orpc/react";
import type { FunnelCandidate, FunnelStage } from "../../types/types";
import { useCandidateFilters } from "./hooks/use-candidate-filters";
import { useStagePagination } from "./hooks/use-stage-pagination";
import { useStageQueries } from "./hooks/use-stage-queries";
import { useStageUpdate } from "./hooks/use-stage-update";

const DEFAULT_COLUMN_VISIBILITY: ColumnVisibility = {
  vacancy: true,
  experience: true,
  location: true,
  matchScore: true,
  salary: true,
  email: false,
  phone: false,
  telegram: false,
  createdAt: true,
};

const STORAGE_KEY = "candidates-pipeline-column-visibility";

export function CandidatePipeline() {
  const { workspaceId } = useWorkspaceContext();
  const orpc = useORPC();

  const [activeView, setActiveView] = useState<"board" | "table">("board");

  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(
    DEFAULT_COLUMN_VISIBILITY,
  );

  // Загрузка настроек видимости из localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<ColumnVisibility>;

        // Валидация: проверяем, что parsed - объект с булевыми значениями
        const isValid =
          parsed &&
          typeof parsed === "object" &&
          Object.values(parsed).every((v) => typeof v === "boolean");

        if (isValid) {
          // Объединяем с дефолтными значениями для безопасной миграции
          setColumnVisibility({ ...DEFAULT_COLUMN_VISIBILITY, ...parsed });
        } else {
          console.warn(
            "Некорректные данные в localStorage, используем значения по умолчанию",
          );
        }
      }
    } catch (error) {
      console.error("Ошибка загрузки настроек видимости колонок:", error);
    }
  }, []);

  // Сохранение настроек видимости в localStorage
  const handleVisibilityChange = useCallback((visibility: ColumnVisibility) => {
    setColumnVisibility(visibility);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility));
    } catch (error) {
      console.error("Ошибка сохранения настроек видимости колонок:", error);
    }
  }, []);

  const {
    selectedVacancy,
    setSelectedVacancy,
    searchText,
    setSearchText,
    debouncedSearch,
    filterStages,
    toggleStageFilter,
    clearStageFilters,
  } = useCandidateFilters();

  const { stageLimits, loadMoreForStage } = useStagePagination();

  const stageQueries = useStageQueries({
    workspaceId,
    selectedVacancy,
    debouncedSearch,
    stageLimits,
  });

  const updateStageMutation = useStageUpdate(workspaceId ?? "");

  const handleDragEnd = useCallback(
    (candidateId: string, newStage: FunnelStage) => {
      if (!workspaceId) return;
      updateStageMutation.mutate({
        workspaceId,
        candidateId,
        stage: newStage,
      });
    },
    [updateStageMutation, workspaceId],
  );

  const { data: vacancies } = useQuery({
    ...orpc.vacancy.listActive.queryOptions({
      input: { workspaceId: workspaceId ?? "" },
    }),
    enabled: !!workspaceId,
  });

  const allCandidates = useMemo(() => {
    const all: FunnelCandidate[] = [];
    stageQueries.forEach(
      (sq: {
        stage: FunnelStage;
        query: { data?: { items: FunnelCandidate[] } };
      }) => {
        if (sq.query.data?.items) {
          all.push(...sq.query.data.items);
        }
      },
    );
    return all;
  }, [stageQueries]);

  const candidatesByStage = useMemo(() => {
    const result: Record<
      FunnelStage,
      { items: FunnelCandidate[]; hasMore: boolean; total: number }
    > = {
      SCREENING_DONE: { items: [], hasMore: false, total: 0 },
      INTERVIEW: { items: [], hasMore: false, total: 0 },
      OFFER_SENT: { items: [], hasMore: false, total: 0 },
      SECURITY_PASSED: { items: [], hasMore: false, total: 0 },
      CONTRACT_SENT: { items: [], hasMore: false, total: 0 },
      ONBOARDING: { items: [], hasMore: false, total: 0 },
      REJECTED: { items: [], hasMore: false, total: 0 },
    };

    stageQueries.forEach(
      (sq: {
        stage: FunnelStage;
        query: {
          data?: {
            items: FunnelCandidate[];
            nextCursor?: string | null;
            total?: number;
          };
        };
      }) => {
        if (sq.query.data) {
          result[sq.stage] = {
            items: sq.query.data.items,
            hasMore: !!sq.query.data.nextCursor,
            total: sq.query.data.total ?? sq.query.data.items.length,
          };
        }
      },
    );

    return result;
  }, [stageQueries]);

  const totalCount = useMemo(() => {
    return Object.values(candidatesByStage).reduce(
      (sum, stage) => sum + stage.total,
      0,
    );
  }, [candidatesByStage]);

  const isLoading = stageQueries.some(
    (sq: { query: { isLoading: boolean } }) => sq.query.isLoading,
  );

  const handleCardClick = useCallback((_candidate: FunnelCandidate) => {
    // TODO: Реализовать модальное окно с деталями кандидата
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
        <div className="flex-1">
          <PipelineToolbar
            selectedVacancy={selectedVacancy ?? ""}
            onVacancyChange={setSelectedVacancy}
            searchText={searchText}
            onSearchChange={setSearchText}
            filterStages={filterStages}
            onToggleStageFilter={toggleStageFilter}
            onClearStageFilters={clearStageFilters}
            vacancies={vacancies}
          />
        </div>
        {activeView === "table" && (
          <ColumnVisibilityToggle
            visibility={columnVisibility}
            onVisibilityChange={handleVisibilityChange}
          />
        )}
      </div>

      <PipelineViewSwitcher
        activeView={activeView}
        onViewChange={setActiveView}
        totalCount={totalCount}
      />

      <div className="flex-1 overflow-hidden">
        {activeView === "board" ? (
          <PipelineBoardView
            candidatesByStage={candidatesByStage}
            allCandidates={allCandidates}
            onCardClick={handleCardClick}
            onLoadMore={loadMoreForStage}
            onDragEnd={handleDragEnd}
            stageQueries={stageQueries}
          />
        ) : (
          <div className="h-full overflow-auto px-4 md:px-6 lg:px-8">
            <CandidatesTable
              candidates={allCandidates}
              onRowClick={handleCardClick}
              isLoading={isLoading}
              visibility={columnVisibility}
            />
          </div>
        )}
      </div>
    </div>
  );
}
