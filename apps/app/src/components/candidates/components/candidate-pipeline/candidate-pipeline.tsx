"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useTRPC } from "~/trpc/react";
import { CandidateModal } from "./candidate-modal";
import { CandidatesTable } from "./candidates-table";
import { useCandidateFilters } from "./hooks/use-candidate-filters";
import { useStagePagination } from "./hooks/use-stage-pagination";
import { useStageQueries } from "./hooks/use-stage-queries";
import { useStageUpdate } from "./hooks/use-stage-update";
import { PipelineBoardView } from "./pipeline-board-view";
import { PipelineToolbar } from "./pipeline-toolbar";
import { PipelineViewSwitcher } from "./pipeline-view-switcher";
import type { FunnelCandidate, FunnelStage } from "./types";

export function CandidatePipeline() {
  const { workspaceId } = useWorkspaceContext();
  const trpc = useTRPC();

  const [activeView, setActiveView] = useState<"board" | "table">("board");
  const [selectedCandidate, setSelectedCandidate] =
    useState<FunnelCandidate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const updateStageMutation = useStageUpdate(stageQueries);

  const handleDragEnd = useCallback(
    (candidateId: string, newStage: FunnelStage) => {
      updateStageMutation.mutate({
        workspaceId: workspaceId ?? "",
        candidateId,
        stage: newStage,
      });
    },
    [updateStageMutation, workspaceId],
  );

  const { data: vacancies } = useQuery({
    ...trpc.vacancy.listActive.queryOptions({
      workspaceId: workspaceId ?? "",
    }),
    enabled: !!workspaceId,
  });

  const allCandidates = useMemo(() => {
    const all: FunnelCandidate[] = [];
    stageQueries.forEach((sq) => {
      if (sq.query.data?.items) {
        all.push(...sq.query.data.items);
      }
    });
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

    stageQueries.forEach((sq) => {
      if (sq.query.data) {
        result[sq.stage] = {
          items: sq.query.data.items,
          hasMore: !!sq.query.data.nextCursor,
          total: sq.query.data.total ?? sq.query.data.items.length,
        };
      }
    });

    return result;
  }, [stageQueries]);

  const totalCount = useMemo(() => {
    return Object.values(candidatesByStage).reduce(
      (sum, stage) => sum + stage.total,
      0,
    );
  }, [candidatesByStage]);

  const isLoading = stageQueries.some((sq) => sq.query.isLoading);

  const handleCardClick = useCallback((candidate: FunnelCandidate) => {
    setSelectedCandidate(candidate);
    setIsModalOpen(true);
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PipelineToolbar
        selectedVacancy={selectedVacancy}
        onVacancyChange={setSelectedVacancy}
        searchText={searchText}
        onSearchChange={setSearchText}
        filterStages={filterStages}
        onToggleStageFilter={toggleStageFilter}
        onClearStageFilters={clearStageFilters}
        vacancies={vacancies}
      />

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
            />
          </div>
        )}
      </div>

      <CandidateModal
        candidate={selectedCandidate}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        workspaceId={workspaceId ?? ""}
      />
    </div>
  );
}
