import type { ScreeningFilter } from "~/components/response";
import { ResponseActionButtons } from "../responses/response-action-buttons";
import { ResponseDialogs } from "../responses/response-dialogs";
import { ResponseSearchFilter } from "../responses/response-search-filter";
import { useRefreshAllResumesState } from "../responses/use-refresh-all-resumes-state";
import { useRefreshState } from "../responses/use-refresh-state";
import { useScreeningState } from "../responses/use-screening-state";
import { useSyncArchivedState } from "../responses/use-sync-archived-state";
import type { ResponseStatusFilterUI } from "./use-response-table";

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
  isProcessingAll: boolean;
  isRefreshingAllResumes: boolean;
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
  isProcessingAll,
  isRefreshingAllResumes,
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
          totalResponses={totalResponses}
          isRefreshing={isRefreshing}
          isProcessingNew={isProcessingNew}
          isProcessingAll={isProcessingAll}
          isRefreshingAllResumes={isRefreshingAllResumes}
          isSyncingArchived={isSyncingArchived}
          onRefreshDialogOpen={() => refreshState.setDialogOpen(true)}
          onSyncArchivedDialogOpen={() => syncArchivedState.setDialogOpen(true)}
          onRefreshAllResumesDialogOpen={() =>
            refreshAllResumesState.setDialogOpen(true)
          }
          onScreenNewDialogOpen={() => screenNewState.setDialogOpen(true)}
          onScreenAllDialogOpen={() => screenAllState.setDialogOpen(true)}
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
