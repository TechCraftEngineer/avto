"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useTRPC } from "~/trpc/react";
import type { FunnelCandidate } from "../../types/types";
import { useCandidateFilters } from "../candidate-pipeline/hooks/use-candidate-filters";
import { CandidatesTable } from "../candidates-table";
import { PipelineToolbar } from "../pipeline-toolbar";

export function CandidatesTableView() {
  const { workspaceId } = useWorkspaceContext();
  const trpc = useTRPC();

  const [_selectedCandidate, setSelectedCandidate] =
    useState<FunnelCandidate | null>(null);
  const [_isModalOpen, setIsModalOpen] = useState(false);

  const {
    selectedVacancy,
    setSelectedVacancy,
    searchText,
    setSearchText,
    debouncedSearch,
  } = useCandidateFilters();

  const { data: vacancies } = useQuery({
    ...trpc.vacancy.listActive.queryOptions({
      workspaceId: workspaceId ?? "",
    }),
    enabled: !!workspaceId,
  });

  const { data: candidatesData, isLoading } = useQuery({
    ...trpc.candidates.list.queryOptions({
      workspaceId: workspaceId ?? "",
      vacancyId: selectedVacancy || undefined,
      search: debouncedSearch || undefined,
      limit: 200,
    }),
    enabled: !!workspaceId,
  });

  const candidates = useMemo(() => {
    return candidatesData?.items ?? [];
  }, [candidatesData]);

  const handleCardClick = useCallback((candidate: FunnelCandidate) => {
    setSelectedCandidate(candidate);
    setIsModalOpen(true);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <PipelineToolbar
        selectedVacancy={selectedVacancy ?? ""}
        onVacancyChange={setSelectedVacancy}
        searchText={searchText}
        onSearchChange={setSearchText}
        vacancies={vacancies}
        hideStageFilters
      />

      <CandidatesTable
        candidates={candidates}
        onRowClick={handleCardClick}
        isLoading={isLoading}
      />
    </div>
  );
}
