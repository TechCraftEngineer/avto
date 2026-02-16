"use client";
import type { ScreeningFilter } from "~/components";
import { ResponseActionButtons } from "../actions/response-action-buttons";
import { useVacancyOperation } from "../context/vacancy-responses-context";
import { ResponseSearchFilter } from "../filters/response-search-filter";
import type { ResponseStatusFilterUI } from "../hooks/use-response-table";
import { useScreeningState } from "../hooks/use-screening-state";
import { useSyncArchivedState } from "../hooks/use-sync-archived-state";
import type { ColumnId } from "../types";
import { ColumnVisibilityToggle } from "../ui/column-visibility-toggle";

interface ResponseTableToolbarProps {
  vacancyId: string;
  totalResponses: number;
  screeningFilter: ScreeningFilter;
  onFilterChange: (filter: ScreeningFilter) => void;
  statusFilter: ResponseStatusFilterUI[];
  onStatusFilterChange: (statuses: ResponseStatusFilterUI[]) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onRefreshComplete: () => void;
  onScreenNew: () => void;
  onScreenAll: () => void;
  onSyncArchived: (workspaceId: string) => void;
  onScreeningComplete: () => void;
  visibleColumns: ReadonlySet<ColumnId>;
  onToggleColumn: (columnId: ColumnId) => void;
  onResetColumns: () => void;
  isHHVacancy?: boolean;
  isArchivedPublication?: boolean;
  hasResponses?: boolean;
  hasActiveIntegrations?: boolean;
}

export function ResponseTableToolbar({
  vacancyId,
  screeningFilter,
  onFilterChange,
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
  onRefreshComplete,
  onScreenNew,
  onScreenAll,
  onSyncArchived,
  onScreeningComplete,
  visibleColumns,
  onToggleColumn,
  onResetColumns,
  isHHVacancy = false,
  isArchivedPublication = false,
  hasResponses = false,
  hasActiveIntegrations = false,
}: ResponseTableToolbarProps) {
  // Получаем состояния операций из Context
  const refreshOp = useVacancyOperation("refresh");
  const archivedOp = useVacancyOperation("archived");
  const screenNewOp = useVacancyOperation("screenNew");
  const screenAllOp = useVacancyOperation("screenAll");

  // Хуки для управления состоянием операций
  useScreeningState(vacancyId, "new", onScreenNew, onScreeningComplete);
  useScreeningState(vacancyId, "all", onScreenAll, onScreeningComplete);
  useSyncArchivedState(vacancyId, onSyncArchived, onRefreshComplete);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1 mb-4">
      <ResponseSearchFilter
        search={search}
        onSearchChange={onSearchChange}
        screeningFilter={screeningFilter}
        onFilterChange={onFilterChange}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
      />

      <div className="flex items-center gap-2">
        <ColumnVisibilityToggle
          visibleColumns={visibleColumns}
          onToggleColumn={onToggleColumn}
          onResetColumns={onResetColumns}
        />
        {(hasActiveIntegrations || isHHVacancy) && (
          <ResponseActionButtons
            isRefreshing={refreshOp.isRunning}
            isSyncingArchived={archivedOp.isRunning}
            isReanalyzing={screenAllOp.isRunning}
            onRefreshDialogOpen={refreshOp.openConfirmation}
            onSyncArchivedDialogOpen={archivedOp.openConfirmation}
            onAnalyzeNewDialogOpen={screenNewOp.openConfirmation}
            onReanalyzeDialogOpen={screenAllOp.openConfirmation}
            isHHVacancy={isHHVacancy}
            isArchivedPublication={isArchivedPublication}
            hasResponses={hasResponses}
          />
        )}
      </div>
    </div>
  );
}
