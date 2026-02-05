"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import {
  Pagination,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@qbs-autonaim/ui";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";
import { BulkActionsBar } from "./bulk-actions-bar";
import { EmptyState } from "./empty-state";
import { ResponseRow } from "./response-row";
import { ResponseTableHeader } from "./response-table-header";
import { ResponseTableToolbar } from "./response-table-toolbar";
import { useResponseActions } from "./use-response-actions";
import { useResponseTable } from "./use-response-table";
import { useColumnVisibility } from "./use-column-visibility";

interface ResponseTableProps {
  vacancyId: string;
  workspaceSlug: string;
  onRefreshDialogOpen?: () => void;
  onSetRefreshHandler?: (handler: () => void) => void;
  onArchivedDialogOpen?: () => void;
  onSetArchivedHandler?: (handler: () => void) => void;
  onScreenNewDialogOpen?: () => void;
  onSetScreenNewHandler?: (handler: () => void) => void;
}

const ITEMS_PER_PAGE = 25;

function getPluralForm(
  n: number,
  one: string,
  few: string,
  many: string,
): string {
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return few;
  }
  return many;
}

type ResponsesListData = RouterOutputs["vacancy"]["responses"]["list"];

type ResponseListItem = ResponsesListData["responses"][0];

export function ResponseTable({
  vacancyId,
  workspaceSlug,
  onRefreshDialogOpen,
  onSetRefreshHandler,
  onArchivedDialogOpen,
  onSetArchivedHandler,
  onScreenNewDialogOpen,
  onSetScreenNewHandler,
}: ResponseTableProps) {
  const trpc = useTRPC();
  const { workspace, orgSlug } = useWorkspace();
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
  } = useColumnVisibility();

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

  // Передаем обработчик обновления в родительский компонент
  useEffect(() => {
    if (onSetRefreshHandler) {
      onSetRefreshHandler(handleRefreshResponses);
    }
  }, [onSetRefreshHandler, handleRefreshResponses]);

  const responses = data?.responses ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const allSelected =
    responses.length > 0 &&
    responses.every((r: ResponseListItem) => selectedIds.has(r.id));

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(responses.map((r) => r.id)));
    }
  };

  // Рендерим скелетон для строк таблицы при загрузке
  const renderTableContent = () => {
    // Показываем скелетоны во время любой загрузки или пока не загружены настройки
    if (isLoading || isFetching || !isHydrated) {
      const skeletonRows = [];
      for (let i = 0; i < 5; i++) {
        skeletonRows.push(
          <TableRow key={`skeleton-${vacancyId}-${currentPage}-${i}`}>
            <TableCell>
              <Skeleton className="h-5 w-5" />
            </TableCell>
            {isColumnVisible("candidate") && (
              <TableCell>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </TableCell>
            )}
            {isColumnVisible("status") && (
              <TableCell>
                <Skeleton className="h-6 w-20" />
              </TableCell>
            )}
            {isColumnVisible("priority") && (
              <TableCell>
                <Skeleton className="h-6 w-16" />
              </TableCell>
            )}
            {isColumnVisible("screening") && (
              <TableCell>
                <Skeleton className="h-6 w-16" />
              </TableCell>
            )}
            {isColumnVisible("potential") && (
              <TableCell>
                <Skeleton className="h-6 w-16" />
              </TableCell>
            )}
            {isColumnVisible("career") && (
              <TableCell>
                <Skeleton className="h-6 w-16" />
              </TableCell>
            )}
            {isColumnVisible("risks") && (
              <TableCell>
                <Skeleton className="h-6 w-16" />
              </TableCell>
            )}
            {isColumnVisible("salary") && (
              <TableCell>
                <Skeleton className="h-6 w-24" />
              </TableCell>
            )}
            {isColumnVisible("skills") && (
              <TableCell>
                <Skeleton className="h-6 w-20" />
              </TableCell>
            )}
            {isColumnVisible("score") && (
              <TableCell>
                <Skeleton className="h-6 w-16" />
              </TableCell>
            )}
            {isColumnVisible("interview") && (
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
            )}
            {isColumnVisible("hrSelection") && (
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
            )}
            {isColumnVisible("coverLetter") && (
              <TableCell>
                <Skeleton className="h-6 w-16" />
              </TableCell>
            )}
            {isColumnVisible("date") && (
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
            )}
            <TableCell>
              <Skeleton className="h-8 w-24" />
            </TableCell>
          </TableRow>,
        );
      }
      return skeletonRows;
    }

    // После загрузки: если нет откликов - показываем пустое состояние
    const visibleColumnCount =
      [...visibleColumns].filter((col) => isColumnVisible(col)).length + 2; // +2 для чекбокса и действий
    if (responses.length === 0 && isFetched) {
      return <EmptyState hasResponses={total > 0} colSpan={visibleColumnCount} />;
    }

    // Показываем отклики
    return responses.map((response: ResponseListItem) => (
      <ResponseRow
        key={response.id}
        orgSlug={orgSlug ?? ""}
        response={response}
        workspaceSlug={workspaceSlug}
        workspaceId={workspace?.id ?? ""}
        isSelected={selectedIds.has(response.id)}
        onSelect={handleSelectOne}
        vacancyId={vacancyId}
        isColumnVisible={isColumnVisible}
      />
    ));
  };

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
        isRefreshing={isRefreshing}
        isSyncingArchived={isSyncingArchived}
        onRefresh={handleRefreshResponses}
        onRefreshComplete={handleRefreshComplete}
        onScreenNew={handleScreenNew}
        onScreenAll={handleScreenAll}
        onSyncArchived={handleSyncArchived}
        onScreeningComplete={handleScreeningDialogClose}
        onRefreshDialogOpen={onRefreshDialogOpen}
        onArchivedDialogOpen={onArchivedDialogOpen}
        onSetArchivedHandler={onSetArchivedHandler}
        onScreenNewDialogOpen={onScreenNewDialogOpen}
        onSetScreenNewHandler={onSetScreenNewHandler}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        onResetColumns={resetColumns}
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
          <Table className="bg-background">
            <ResponseTableHeader
              allSelected={allSelected}
              onSelectAll={handleSelectAll}
              hasResponses={responses.length > 0}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              isColumnVisible={isColumnVisible}
            />
            <TableBody>{renderTableContent()}</TableBody>
          </Table>
        </div>

        {total > 0 && (
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
