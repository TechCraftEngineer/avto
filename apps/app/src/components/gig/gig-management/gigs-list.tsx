import { Skeleton } from "@qbs-autonaim/ui";
import type { DisplayMode } from "../filters/gigs-filters";
import { EmptyState, GigCard, GigListItem } from "./index";
import type { Gig } from "../filters/use-gigs-filters";

interface GigsListProps {
  gigs: Gig[] | undefined;
  filteredGigs: Gig[];
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
}: GigsListProps) {
  // Показываем скелетоны только при первой загрузке (когда данных еще нет)
  if (isLoading && gigs === undefined) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_) => (
          <div key={crypto.randomUUID()} className="rounded-lg border p-6">
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

      <div
        className={
          displayMode === "grid"
            ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            : displayMode === "list"
              ? "space-y-4"
              : "space-y-2"
        }
      >
        {filteredGigs.map((gig) => {
          const gigData = {
            ...gig,
            isActive: gig.isActive ?? true,
          };

          if (displayMode === "list") {
            return (
              <GigListItem
                key={gig.id}
                gig={gigData}
                orgSlug={orgSlug}
                workspaceSlug={workspaceSlug}
                onDelete={onDelete}
              />
            );
          }

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
    </>
  );
}