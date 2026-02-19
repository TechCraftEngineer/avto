"use client";
import type { ScreeningFilter } from "~/components";
import { ResponseActionButtons } from "../actions/response-action-buttons";
import { useVacancyOperation } from "../context/vacancy-responses-context";
import { ResponseSearchFilter } from "../filters/response-search-filter";
import { useRefreshState } from "../hooks/use-refresh-state";
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
  onRefresh: () => void;
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
  onRefresh,
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

  // Хуки для управления состоянием операций (регистрируют handlers в Context)
  useRefreshState(vacancyId, onRefresh, onRefreshComplete);
  useScreeningState(vacancyId, "new", onScreenNew, onScreeningComplete);
  useScreeningState(vacancyId, "all", onScreenAll, onScreeningComplete);
  useSyncArchivedState(vacancyId, onSyncArchived, onRefreshComplete);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4 px-1 mb-4 min-w-0">
      <ResponseSearchFilter
        search={search}
        onSearchChange={onSearchChange}
        screeningFilter={screeningFilter}
        onFilterChange={onFilterChange}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
      />

      <div className="flex flex-wrap items-center gap-2 shrink-0">
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
