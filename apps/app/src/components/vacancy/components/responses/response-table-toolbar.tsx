"use client";
import { useEffect } from "react";
import type { ScreeningFilter } from "~/components";
import { ColumnVisibilityToggle } from "./column-visibility-toggle";
import { ResponseActionButtons } from "./response-action-buttons";
import { ResponseSearchFilter } from "./response-search-filter";
import type { ColumnId } from "./types";
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
  onScreenNewDialogOpen?: () => void;
  onSetScreenNewHandler?: (handler: () => void) => void;
  visibleColumns: ReadonlySet<ColumnId>;
  onToggleColumn: (columnId: ColumnId) => void;
  onResetColumns: () => void;
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
  isSyncingArchived,
  onRefresh,
  onRefreshComplete,
  onScreenNew,
  onSyncArchived,
  onScreeningComplete,
  onRefreshDialogOpen,
  onArchivedDialogOpen,
  onSetArchivedHandler,
  onScreenNewDialogOpen,
  onSetScreenNewHandler,
  visibleColumns,
  onToggleColumn,
  onResetColumns,
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

  // Передаем обработчик скрининга наверх
  useEffect(() => {
    if (onSetScreenNewHandler) {
      onSetScreenNewHandler(screenNewState.handleClick);
    }
  }, [onSetScreenNewHandler, screenNewState.handleClick]);

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
        <ResponseActionButtons
          isRefreshing={isRefreshing}
          isSyncingArchived={isSyncingArchived}
          onRefreshDialogOpen={
            onRefreshDialogOpen || (() => refreshState.setDialogOpen(true))
          }
          onSyncArchivedDialogOpen={
            onArchivedDialogOpen ||
            (() => syncArchivedState.setDialogOpen(true))
          }
        />
      </div>
    </div>
  );
}
