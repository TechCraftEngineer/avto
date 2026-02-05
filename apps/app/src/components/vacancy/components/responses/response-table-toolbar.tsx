"use client";
import { useEffect } from "react";
import type { ScreeningFilter } from "~/components";
import { ResponseActionButtons } from "./response-action-buttons";
import { ResponseSearchFilter } from "./response-search-filter";
import { useRefreshState } from "./use-refresh-state";
import type { ResponseStatusFilterUI } from "./use-response-table";
import { useScreeningState } from "./use-screening-state";
import { useSyncArchivedState } from "./use-sync-archived-state";

interface ResponseTableToolbarProps {
  vacancyId: string;
  totalResponses: number;
  screeningFilter: ScreeningFilter;
  onFilterChange: (filter: ScreeningFilter) => void;
  statusFilter: ResponseStatusFilterUI[];
  onStatusFilterChange: (statuses: ResponseStatusFilterUI[]) => void;
  search: string;
  onSearchChange: (value: string) => void;
  isRefreshing: boolean;
  isProcessingNew: boolean;
  isSyncingArchived: boolean;
  onRefresh: () => void;
  onRefreshComplete: () => void;
  onScreenNew: () => void;
  onScreenAll: () => void;
  onSyncArchived: (workspaceId: string) => void;
  onScreeningComplete: () => void;
  onRefreshDialogOpen?: () => void;
  onArchivedDialogOpen?: () => void;
  onSetArchivedHandler?: (handler: () => void) => void;
}

export function ResponseTableToolbar({
  vacancyId,
  screeningFilter,
  onFilterChange,
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
  isRefreshing,
  isProcessingNew,
  isSyncingArchived,
  onRefresh,
  onRefreshComplete,
  onScreenNew,
  onSyncArchived,
  onScreeningComplete,
  onRefreshDialogOpen,
  onArchivedDialogOpen,
  onSetArchivedHandler,
}: ResponseTableToolbarProps) {
  // Custom hooks for different operation states
  const refreshState = useRefreshState(vacancyId, onRefresh, onRefreshComplete);
  const screenNewState = useScreeningState(
    vacancyId,
    "new",
    onScreenNew,
    onScreeningComplete,
  );
  const syncArchivedState = useSyncArchivedState(
    vacancyId,
    onSyncArchived,
    onRefreshComplete,
  );

  // Передаем обработчик наверх для использования в RefreshStatusIndicator
  useEffect(() => {
    if (onSetArchivedHandler) {
      onSetArchivedHandler(syncArchivedState.handleClick);
    }
  }, [onSetArchivedHandler, syncArchivedState.handleClick]);

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

      <ResponseActionButtons
        isRefreshing={isRefreshing}
        isProcessingNew={isProcessingNew}
        isSyncingArchived={isSyncingArchived}
        onRefreshDialogOpen={
          onRefreshDialogOpen || (() => refreshState.setDialogOpen(true))
        }
        onSyncArchivedDialogOpen={
          onArchivedDialogOpen || (() => syncArchivedState.setDialogOpen(true))
        }
        onScreenNew={screenNewState.handleClick}
      />
    </div>
  );
}
