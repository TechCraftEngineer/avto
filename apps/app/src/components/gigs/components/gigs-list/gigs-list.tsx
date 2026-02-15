import { Skeleton } from "@qbs-autonaim/ui";
import { EmptyState } from "../empty-state";
import { GigCard } from "../gig-card";
import { GigsAttentionBlock } from "../gigs-attention-block";
import type { DisplayMode, Gig } from "../gigs-filters";
import { GigsTable } from "../gigs-table";

type GigWithActive = Gig & { isActive: boolean };

interface GigsListProps {
  gigs: Gig[] | undefined;
  filteredGigs: GigWithActive[];
  isLoading: boolean;
  displayMode: DisplayMode;
  searchQuery: string;
  typeFilter: string;
  statusFilter: string;
  orgSlug: string;
  workspaceSlug: string;
  onDelete: (gigId: string) => void;
  onDuplicate: (gigId: string) => void;
  onToggleActive: (gigId: string) => void;
  onSyncResponses: (gigId: string) => void;
  tableSortField?: string | null;
  tableSortDirection?: "asc" | "desc";
  onTableSort?: (field: string) => void;
  showAttentionBlock?: boolean;
}

export function GigsList({
  gigs,
  filteredGigs,
  isLoading,
  displayMode,
  searchQuery,
  typeFilter,
  statusFilter,
  orgSlug,
  workspaceSlug,
  onDelete,
  onDuplicate,
  onToggleActive,
  onSyncResponses,
  tableSortField = null,
  tableSortDirection = "asc",
  onTableSort,
  showAttentionBlock = true,
}: GigsListProps) {
  const getAttentionGigs = () => {
    const now = Date.now();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    return filteredGigs.filter((g) => {
      const hasNew = (g.newResponses ?? 0) > 0;
      const deadline = g.deadline ? new Date(g.deadline).getTime() : null;
      const isOverdue = deadline && deadline < now && g.isActive;
      const isUrgent =
        deadline &&
        g.isActive &&
        !isOverdue &&
        deadline - now <= threeDays &&
        deadline - now > 0;
      return hasNew || !!isOverdue || !!isUrgent;
    });
  };

  const attentionGigs = showAttentionBlock ? getAttentionGigs() : [];
  const mainGigs = filteredGigs.filter(
    (g) => !attentionGigs.some((a) => a.id === g.id),
  );
  // Показываем скелетоны только при первой загрузке (когда данных еще нет)
  if (isLoading && gigs === undefined) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_) => (
          <div
            key={crypto.randomUUID()}
            className="rounded-lg border bg-card shadow-sm p-6"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-16 w-full" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-4 w-8" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Показываем EmptyState только когда данные загружены и список действительно пуст
  if (!isLoading && gigs !== undefined && filteredGigs.length === 0) {
    return (
      <EmptyState
        orgSlug={orgSlug}
        workspaceSlug={workspaceSlug}
        title={
          searchQuery || typeFilter !== "all" || statusFilter !== "all"
            ? "Ничего не найдено"
            : "Нет заданий"
        }
        description={
          searchQuery || typeFilter !== "all" || statusFilter !== "all"
            ? "Попробуйте изменить параметры поиска"
            : "Создайте первое разовое задание, чтобы начать поиск исполнителей"
        }
        showCreateButton={
          !searchQuery && typeFilter === "all" && statusFilter === "all"
        }
      />
    );
  }

  const renderMainList = () => {
    const listGigs = showAttentionBlock ? mainGigs : filteredGigs;

    if (displayMode === "table") {
      return (
        <GigsTable
          gigs={listGigs}
          orgSlug={orgSlug}
          workspaceSlug={workspaceSlug}
          sortField={tableSortField}
          sortDirection={tableSortDirection ?? "asc"}
          onSort={onTableSort ?? (() => {})}
          onDelete={onDelete}
        />
      );
    }

    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
        {listGigs.map((gig) => {
          const gigData = {
            ...gig,
            isActive: gig.isActive ?? true,
          };
          return (
            <GigCard
              key={gig.id}
              gig={gigData}
              orgSlug={orgSlug}
              workspaceSlug={workspaceSlug}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onToggleActive={onToggleActive}
              onSyncResponses={onSyncResponses}
            />
          );
        })}
      </div>
    );
  };

  return (
    <>
      {!isLoading && filteredGigs.length > 0 && (
        <div className="mb-3 text-sm text-muted-foreground">
          Найдено заданий:{" "}
          <span className="font-medium tabular-nums">
            {filteredGigs.length}
          </span>
          {(searchQuery || typeFilter !== "all" || statusFilter !== "all") &&
            gigs &&
            filteredGigs.length !== gigs.length && (
              <span> из {gigs.length}</span>
            )}
        </div>
      )}

      {attentionGigs.length > 0 && (
        <GigsAttentionBlock
          gigs={attentionGigs}
          displayMode={displayMode === "table" ? "compact" : "grid"}
          orgSlug={orgSlug}
          workspaceSlug={workspaceSlug}
          onDelete={onDelete}
        />
      )}

      {renderMainList()}
    </>
  );
}
