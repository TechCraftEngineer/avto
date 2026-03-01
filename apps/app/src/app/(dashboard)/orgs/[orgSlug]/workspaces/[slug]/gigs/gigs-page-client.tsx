"use client";

import type { SortDirection } from "@qbs-autonaim/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DeleteGigDialog,
  GigsFilters,
  GigsList,
  GigsStats,
  useGigsFilters,
} from "~/components/gig";
import type { DisplayMode } from "~/components/gigs";
import { PageHeader } from "~/components/layout";
import { env } from "~/env";
import { useWorkspace } from "~/hooks/use-workspace";
import { useWorkspaceParams } from "~/hooks/use-workspace-params";
import { useORPC } from "~/orpc/react";

const GIGS_PAGE_STORAGE_KEY = "gigs-page-settings";

function loadGigsSettings() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(GIGS_PAGE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as {
      displayMode?: DisplayMode;
      sortBy?: string;
      statusFilter?: string;
      typeFilter?: string;
      quickFilter?: string;
      groupBy?: "none" | "urgency";
    };
  } catch {
    return null;
  }
}

function saveGigsSettings(settings: {
  displayMode: DisplayMode;
  sortBy: string;
  statusFilter: string;
  typeFilter: string;
  quickFilter: string;
  groupBy: "none" | "urgency";
}) {
  try {
    localStorage.setItem(GIGS_PAGE_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function GigsPageClient() {
  const { orgSlug, slug: workspaceSlug } = useWorkspaceParams();
  const orpc = useORPC();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("grid");
  const [quickFilter, setQuickFilter] = useState<string>("");
  const [groupBy, setGroupBy] = useState<"none" | "urgency">("none");
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    if (settingsLoaded) return;
    const stored = loadGigsSettings();
    if (stored) {
      if (stored.typeFilter) setTypeFilter(stored.typeFilter);
      if (stored.statusFilter) setStatusFilter(stored.statusFilter);
      if (stored.sortBy) setSortBy(stored.sortBy);
      if (stored.displayMode) {
        setDisplayMode(
          stored.displayMode === "grid" || stored.displayMode === "table"
            ? stored.displayMode
            : "grid",
        );
      }
      if (stored.quickFilter) setQuickFilter(stored.quickFilter);
      if (stored.groupBy) setGroupBy(stored.groupBy);
    }
    setSettingsLoaded(true);
  }, [settingsLoaded]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gigToDelete, setGigToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const { data: gigs, isLoading } = useQuery({
    ...orpc.gig.list.queryOptions({
      input: { workspaceId: workspace?.id ?? "" },
    }),
    enabled: !!workspace?.id,
  });

  useEffect(() => {
    saveGigsSettings({
      displayMode,
      sortBy,
      statusFilter,
      typeFilter,
      quickFilter,
      groupBy,
    });
  }, [displayMode, sortBy, statusFilter, typeFilter, quickFilter, groupBy]);

  const { filteredAndSortedGigs, stats } = useGigsFilters(gigs, {
    searchQuery,
    typeFilter,
    statusFilter,
    sortBy,
    sortDirection,
    quickFilter,
    groupBy,
  });

  const gigsWithActive = filteredAndSortedGigs.map((g) => ({
    ...g,
    isActive: g.isActive ?? true,
  }));

  const handleTableSort = useCallback((field: string) => {
    setSortBy((prev) => {
      if (prev === field) {
        setSortDirection((d: SortDirection) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortDirection(field === "title" ? "asc" : "desc");
      }
      return field;
    });
  }, []);

  const handleStatsCardClick = useCallback(
    (card: "total" | "active" | "responses" | "newResponses" | "overdue") => {
      switch (card) {
        case "newResponses":
          setQuickFilter((q) =>
            q === "hasNewResponses" ? "" : "hasNewResponses",
          );
          break;
        case "active":
          setStatusFilter((s) => (s === "active" ? "all" : "active"));
          break;
        case "overdue":
          setQuickFilter((q) =>
            q === "needsAttention" ? "" : "needsAttention",
          );
          break;
        default:
          break;
      }
    },
    [],
  );

  const deleteMutation = useMutation(
    orpc.gig.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Задание удалено");
        queryClient.invalidateQueries({
          queryKey: orpc.gig.list.queryKey({
            input: { workspaceId: workspace?.id ?? "" },
          }),
        });
        setDeleteDialogOpen(false);
        setGigToDelete(null);
      },
      onError: (error) => {
        toast.error(error.message || "Не удалось удалить задание");
      },
    }),
  );

  const syncResponsesMutation = useMutation(
    orpc.freelancePlatforms.syncGigResponses.mutationOptions({
      onSuccess: () => {
        toast.success("Синхронизация откликов запущена");
        queryClient.invalidateQueries({
          queryKey: orpc.gig.list.queryKey({
            input: { workspaceId: workspace?.id ?? "" },
          }),
        });
      },
      onError: (error) => {
        toast.error(error.message || "Ошибка синхронизации");
      },
    }),
  );

  const duplicateMutation = useMutation(
    orpc.gig.duplicate.mutationOptions({
      onSuccess: (_data) => {
        toast.success("Задание дублировано");
        queryClient.invalidateQueries({
          queryKey: orpc.gig.list.queryKey({
            input: { workspaceId: workspace?.id ?? "" },
          }),
        });
      },
      onError: (error) => {
        toast.error(error.message || "Не удалось дублировать задание");
      },
    }),
  );

  const toggleActiveMutation = useMutation(
    orpc.gig.toggleActive.mutationOptions({
      onSuccess: (data) => {
        toast.success(
          data.isActive ? "Задание активировано" : "Задание деактивировано",
        );
        queryClient.invalidateQueries({
          queryKey: orpc.gig.list.queryKey({
            input: { workspaceId: workspace?.id ?? "" },
          }),
        });
      },
      onError: (error) => {
        toast.error(error.message || "Не удалось изменить статус");
      },
    }),
  );

  const handleDeleteClick = useCallback(
    (gigId: string) => {
      const gig = gigs?.find((g) => g.id === gigId);
      if (gig) {
        setGigToDelete({ id: gig.id, title: gig.title });
        setDeleteDialogOpen(true);
      }
    },
    [gigs],
  );

  const handleDeleteConfirm = useCallback(() => {
    if (gigToDelete && workspace?.id) {
      deleteMutation.mutate({
        gigId: gigToDelete.id,
        workspaceId: workspace.id,
      });
    }
  }, [gigToDelete, workspace?.id, deleteMutation]);

  const handleDuplicate = useCallback(
    (gigId: string) => {
      const gig = gigs?.find((g) => g.id === gigId);
      if (gig && workspace?.id) {
        duplicateMutation.mutate({
          gigId: gig.id,
          workspaceId: workspace.id,
        });
      }
    },
    [gigs, workspace?.id, duplicateMutation],
  );

  const handleToggleActive = useCallback(
    (gigId: string) => {
      const gig = gigs?.find((g) => g.id === gigId);
      if (gig && workspace?.id) {
        toggleActiveMutation.mutate({
          gigId: gig.id,
          workspaceId: workspace.id,
        });
      }
    },
    [gigs, workspace?.id, toggleActiveMutation],
  );

  const handleSyncResponses = useCallback(
    (gigId: string) => {
      if (workspace?.id) {
        syncResponsesMutation.mutate({
          workspaceId: workspace.id,
          gigId,
        });
      }
    },
    [workspace?.id, syncResponsesMutation],
  );

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2 px-4 lg:px-6">
          <PageHeader
            title="Разовые задания"
            description="Создание и управление разовыми задачами"
            tooltipContent={`Разовые задания — это задачи с фиксированным объёмом и сроком. Создавайте задания, получайте отклики и управляйте статусами в одном месте.\n\n[Подробнее в документации](${env.NEXT_PUBLIC_DOCS_URL}/candidates/gig)`}
          />
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <GigsStats
              stats={stats}
              isLoading={isLoading}
              onCardClick={handleStatsCardClick}
            />

            <>
              <GigsFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                typeFilter={typeFilter}
                onTypeFilterChange={setTypeFilter}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                displayMode={displayMode}
                onDisplayModeChange={setDisplayMode}
                quickFilter={quickFilter}
                onQuickFilterChange={setQuickFilter}
                groupBy={groupBy}
                onGroupByChange={setGroupBy}
                orgSlug={orgSlug || ""}
                workspaceSlug={workspaceSlug || ""}
                newResponsesCount={stats.newResponses}
              />

              <GigsList
                gigs={gigs}
                filteredGigs={gigsWithActive}
                isLoading={isLoading}
                displayMode={displayMode}
                searchQuery={searchQuery}
                typeFilter={typeFilter}
                statusFilter={statusFilter}
                orgSlug={orgSlug || ""}
                workspaceSlug={workspaceSlug || ""}
                onDelete={handleDeleteClick}
                onDuplicate={handleDuplicate}
                onToggleActive={handleToggleActive}
                onSyncResponses={handleSyncResponses}
                tableSortField={displayMode === "table" ? sortBy : null}
                tableSortDirection={sortDirection}
                onTableSort={handleTableSort}
              />
            </>
          </div>
        </div>
      </div>

      <DeleteGigDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        gigTitle={gigToDelete?.title ?? ""}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
