"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useTRPC } from "~/trpc/react";
import type { FunnelCandidate } from "../../types/types";
import { useCandidateFilters } from "../candidate-pipeline/hooks/use-candidate-filters";
import {
  CandidatesTable,
  type ColumnVisibility,
  ColumnVisibilityToggle,
} from "../candidates-table";
import { PipelineToolbar } from "../pipeline-toolbar";

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

const STORAGE_KEY = "candidates-table-column-visibility";

export function CandidatesTableView() {
  const { workspaceId } = useWorkspaceContext();
  const trpc = useTRPC();

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

  const handleCardClick = useCallback((_candidate: FunnelCandidate) => {
    // TODO: Реализовать модальное окно с деталями кандидата
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <PipelineToolbar
            selectedVacancy={selectedVacancy ?? ""}
            onVacancyChange={setSelectedVacancy}
            searchText={searchText}
            onSearchChange={setSearchText}
            vacancies={vacancies}
            hideStageFilters
          />
        </div>
        <ColumnVisibilityToggle
          visibility={columnVisibility}
          onVisibilityChange={handleVisibilityChange}
        />
      </div>

      <CandidatesTable
        candidates={candidates}
        onRowClick={handleCardClick}
        isLoading={isLoading}
        visibility={columnVisibility}
      />
    </div>
  );
}
