import type { ScreeningFilter } from "~/components/responses";
import { ResponseActionButtons } from "./response-action-buttons";
import { ResponseDialogs } from "./response-dialogs";
import { ResponseSearchFilter } from "./response-search-filter";
import { useRefreshAllResumesState } from "./use-refresh-all-resumes-state";
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
  onRefreshAllResumes: () => void;
  onRefreshAllResumesDialogClose: () => void;
  onScreenNew: () => void;
  onScreenAll: () => void;
  onSyncArchived: (workspaceId: string) => void;
  onScreeningDialogClose: () => void;
}

export function ResponseTableToolbar({
  vacancyId,
  totalResponses,
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
  onRefreshAllResumes,
  onRefreshAllResumesDialogClose,
  onScreenNew,
  onScreenAll,
  onSyncArchived,
  onScreeningDialogClose,
}: ResponseTableToolbarProps) {
  // Custom hooks for different operation states
  const refreshState = useRefreshState(vacancyId, onRefresh, onRefreshComplete);
  const screenNewState = useScreeningState(
    vacancyId,
    "new",
    onScreenNew,
    onScreeningDialogClose,
  );
  const screenAllState = useScreeningState(
    vacancyId,
    "all",
    onScreenAll,
    onScreeningDialogClose,
  );
  const syncArchivedState = useSyncArchivedState(
    vacancyId,
    onSyncArchived,
    onRefreshComplete,
  );
  const refreshAllResumesState = useRefreshAllResumesState(
    vacancyId,
    onRefreshAllResumes,
    onRefreshAllResumesDialogClose,
  );

  return (
    <>
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
          onRefreshDialogOpen={() => refreshState.setDialogOpen(true)}
          onSyncArchivedDialogOpen={() => syncArchivedState.setDialogOpen(true)}
          onScreenNewDialogOpen={() => screenNewState.setDialogOpen(true)}
        />
      </div>

      <ResponseDialogs
        totalResponses={totalResponses}
        refreshState={refreshState}
        screenNewState={screenNewState}
        screenAllState={screenAllState}
        syncArchivedState={syncArchivedState}
        refreshAllResumesState={refreshAllResumesState}
      />
    </>
  );
}
