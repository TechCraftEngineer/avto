"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import {
  DataGrid,
  DataGridContainer,
  DataGridTableDnd,
} from "@qbs-autonaim/ui/data-grid";
import { Pagination, Table, TableBody } from "@qbs-autonaim/ui";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";
import { fetchRefreshVacancyResponsesToken } from "~/actions/realtime";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";
import type { ColumnId } from "../types";
import { BulkActionsBar } from "../actions/bulk-actions-bar";
import { useVacancyOperation } from "../context/vacancy-responses-context";
import { useColumnVisibility } from "../hooks/use-column-visibility";
import { useRefreshSubscription } from "../hooks/use-refresh-subscription";
import { useResponseActions } from "../hooks/use-response-actions";
import { useResponseTable } from "../hooks/use-response-table";
import { EmptyState } from "../ui/empty-state";
import {
  responseColumns,
  type ResponseTableMeta,
} from "./response-columns";
import { ResponseTableToolbar } from "./response-table-toolbar";

interface ResponseTableProps {
  vacancyId: string;
  workspaceSlug: string;
}

const ITEMS_PER_PAGE = 25;

const DATA_COLUMN_IDS: ColumnId[] = [
  "candidate",
  "status",
  "priority",
  "screening",
  "potential",
  "career",
  "risks",
  "salary",
  "skills",
  "interview",
  "hrSelection",
  "coverLetter",
  "date",
];

function getPluralForm(
  n: number,
  one: string,
  few: string,
  many: string,
): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function ResponseTable({
  vacancyId,
  workspaceSlug,
}: ResponseTableProps) {
  const trpc = useTRPC();
  const { workspace, orgSlug } = useWorkspace();
  const archivedOp = useVacancyOperation("archived");
  const {
    currentPage,
    setCurrentPage,
    sortField,
    sortDirection,
    handleSort,
    selectedIds,
    setSelectedIds,
    screeningFilter,
    setScreeningFilter,
    statusFilter,
    apiStatusFilter,
    setStatusFilter,
    searchInput,
    debouncedSearch,
    handleSearchChange,
    handleSelectOne,
  } = useResponseTable();

  const {
    visibleColumns,
    isHydrated,
    toggleColumn,
    resetColumns,
    isColumnVisible,
    columnOrder,
    setColumnOrder,
  } = useColumnVisibility();

  const { data: vacancyData } = useQuery({
    ...trpc.vacancy.get.queryOptions({
      id: vacancyId,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id,
    staleTime: 5 * 60 * 1000,
  });

  const isHHVacancy = useMemo(
    () => vacancyData?.source === "HH",
    [vacancyData?.source],
  );

  const isArchivedPublication = useMemo(() => {
    const hhPublication = vacancyData?.publications?.find(
      (pub: { platform: string; isActive: boolean }) => pub.platform === "HH",
    );
    return !(hhPublication?.isActive ?? true);
  }, [vacancyData?.publications]);

  const hasActiveIntegrations = useMemo(
    () => vacancyData?.publications?.some((pub) => pub.isActive) ?? false,
    [vacancyData?.publications],
  );

  const { data, isLoading, isFetching, isFetched } = useQuery({
    ...trpc.vacancy.responses.list.queryOptions({
      workspaceId: workspace?.id ?? "",
      vacancyId,
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      sortField,
      sortDirection,
      screeningFilter,
      statusFilter: apiStatusFilter,
      search: debouncedSearch,
    }),
    enabled: !!workspace?.id,
    placeholderData: keepPreviousData,
  });

  const {
    isProcessing,
    isRefreshing,
    isSendingWelcome,
    isSyncingArchived,
    handleBulkScreen,
    handleScreenAll,
    handleScreenNew,
    handleSyncArchived,
    handleScreeningDialogClose,
    handleRefreshResponses,
    handleRefreshComplete,
    handleSendWelcomeBatch,
  } = useResponseActions(
    vacancyId,
    workspace?.id ?? "",
    selectedIds,
    setSelectedIds,
  );

  useRefreshSubscription({
    vacancyId,
    enabled: isRefreshing,
    fetchToken: fetchRefreshVacancyResponsesToken,
    onComplete: (success) => {
      handleRefreshComplete();
      if (!success) {
        console.error(
          "Ошибка при обновлении откликов для вакансии:",
          vacancyId,
        );
      }
    },
  });

  useEffect(() => {
    if (!isRefreshing) return;
    const timeoutId = setTimeout(handleRefreshComplete, 5 * 60 * 1000);
    return () => clearTimeout(timeoutId);
  }, [isRefreshing, handleRefreshComplete]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset selection when filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [
    currentPage,
    sortField,
    sortDirection,
    screeningFilter,
    statusFilter,
    debouncedSearch,
  ]);

  const responses = data?.responses ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const handleSelectAll = useCallback(
    (selectAll: boolean) => {
      if (selectAll) {
        setSelectedIds(new Set(responses.map((r) => r.id)));
      } else {
        setSelectedIds(new Set());
      }
    },
    [responses, setSelectedIds],
  );

  const fullColumnOrder = useMemo(
    () => ["select", ...columnOrder, "actions"] as string[],
    [columnOrder],
  );

  const columnVisibility = useMemo(
    () =>
      Object.fromEntries(
        DATA_COLUMN_IDS.map((id) => [id, visibleColumns.has(id)]),
      ),
    [visibleColumns],
  );

  const tableMeta: ResponseTableMeta = useMemo(
    () => ({
      orgSlug: orgSlug ?? "",
      workspaceSlug,
      workspaceId: workspace?.id ?? "",
      vacancyId,
      selectedIds,
      onSelect: handleSelectOne,
      onSelectAll: handleSelectAll,
      sortField,
      sortDirection,
      onSort: handleSort,
      visibleColumnIds: visibleColumns,
    }),
    [
      orgSlug,
      workspaceSlug,
      workspace?.id,
      vacancyId,
      selectedIds,
      handleSelectOne,
      handleSelectAll,
      sortField,
      sortDirection,
      handleSort,
      visibleColumns,
    ],
  );

  const table = useReactTable({
    data: responses,
    columns: responseColumns,
    state: {
      columnOrder: fullColumnOrder,
      columnVisibility,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize: ITEMS_PER_PAGE,
      },
    },
    onColumnOrderChange: (updater) => {
      const next = updater(fullColumnOrder);
      const dataOrder = next.filter(
        (id): id is ColumnId =>
          id !== "select" && id !== "actions" && DATA_COLUMN_IDS.includes(id),
      );
      setColumnOrder(dataOrder);
    },
    onColumnVisibilityChange: () => {},
    manualPagination: true,
    pageCount: totalPages,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: tableMeta,
  });

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || String(active.id) === String(over.id)) return;

      const oldIndex = fullColumnOrder.indexOf(String(active.id));
      const newIndex = fullColumnOrder.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(fullColumnOrder, oldIndex, newIndex);
      const dataOrder = reordered.filter(
        (id): id is ColumnId =>
          id !== "select" && id !== "actions" && DATA_COLUMN_IDS.includes(id),
      );
      setColumnOrder(dataOrder);
    },
    [fullColumnOrder, setColumnOrder],
  );

  const isEmpty = responses.length === 0 && isFetched;
  const visibleColumnCount =
    [...visibleColumns].filter((col) => isColumnVisible(col)).length + 2;

  return (
    <div className="space-y-4">
      <ResponseTableToolbar
        vacancyId={vacancyId}
        totalResponses={total}
        screeningFilter={screeningFilter}
        onFilterChange={setScreeningFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        search={searchInput}
        onSearchChange={handleSearchChange}
        onRefreshComplete={handleRefreshComplete}
        onScreenNew={handleScreenNew}
        onScreenAll={handleScreenAll}
        onSyncArchived={handleSyncArchived}
        onScreeningComplete={handleScreeningDialogClose}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        onResetColumns={resetColumns}
        isHHVacancy={isHHVacancy}
        isArchivedPublication={isArchivedPublication}
        hasResponses={total > 0}
        hasActiveIntegrations={hasActiveIntegrations}
      />

      <div className="rounded-md border bg-transparent">
        {selectedIds.size > 0 && (
          <BulkActionsBar
            selectedCount={selectedIds.size}
            isSendingWelcome={isSendingWelcome}
            isProcessing={isProcessing}
            onSendWelcome={handleSendWelcomeBatch}
            onBulkScreen={handleBulkScreen}
          />
        )}

        <div className="relative w-full overflow-auto">
          {isEmpty ? (
            <Table className="bg-background">
              <TableBody>
                <EmptyState
                  hasResponses={total > 0}
                  colSpan={visibleColumnCount}
                  onRefresh={handleRefreshResponses}
                  onSyncArchivedDialogOpen={archivedOp.openConfirmation}
                  isRefreshing={isRefreshing}
                  isSyncingArchived={isSyncingArchived}
                  source={vacancyData?.source}
                  externalId={vacancyData?.externalId}
                  isActive={!isArchivedPublication}
                />
              </TableBody>
            </Table>
          ) : (
            <DataGrid
              table={table}
              recordCount={total}
              isLoading={isLoading || isFetching || !isHydrated}
              emptyMessage={null}
              tableLayout={{
                columnsDraggable: true,
                headerBackground: true,
                headerBorder: true,
                rowBorder: true,
                width: "fixed",
              }}
            >
              <DataGridContainer className="bg-background border-0 rounded-none">
                <DataGridTableDnd handleDragEnd={handleDragEnd} />
              </DataGridContainer>
            </DataGrid>
          )}
        </div>

        {total > 0 && !isEmpty && (
          <div className="flex items-center justify-between border-t bg-background/80 backdrop-blur-sm px-4 py-4">
            <div className="flex-1 text-sm text-muted-foreground whitespace-nowrap">
              {selectedIds.size} из {total}{" "}
              {getPluralForm(total, "отклика", "откликов", "откликов")} выбрано
            </div>
            <div className="flex items-center space-x-2">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
