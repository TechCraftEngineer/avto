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
import { useCallback, useEffect, useMemo } from "react";
import { fetchRefreshVacancyResponsesToken } from "~/actions/realtime";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";
import { BulkActionsBar } from "../actions/bulk-actions-bar";
import { useVacancyOperation } from "../context/vacancy-responses-context";
import { useColumnVisibility } from "../hooks/use-column-visibility";
import { useRefreshSubscription } from "../hooks/use-refresh-subscription";
import { useResponseActions } from "../hooks/use-response-actions";
import { useResponseTable } from "../hooks/use-response-table";
import { ResponseRow } from "../response-row";
import { EmptyState } from "../ui/empty-state";
import { ResponseTableHeader } from "./response-table-header";
import { ResponseTableToolbar } from "./response-table-toolbar";

interface ResponseTableProps {
  vacancyId: string;
  workspaceSlug: string;
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
  } = useColumnVisibility();

  // Получаем данные вакансии для проверки источника импорта
  const { data: vacancyData } = useQuery({
    ...trpc.vacancy.get.queryOptions({
      id: vacancyId,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id,
    staleTime: 5 * 60 * 1000, // 5 минут - данные вакансии редко меняются
  });

  // Мемоизируем производные значения, чтобы избежать лишних ре-рендеров
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

  // Обработчик для синхронизации архивных откликов с workspaceId
  const handleSyncArchivedWithWorkspace = useCallback(() => {
    if (workspace?.id) {
      void handleSyncArchived(workspace.id);
    }
  }, [workspace?.id, handleSyncArchived]);

  // Подписываемся на события завершения обновления откликов через realtime
  useRefreshSubscription({
    vacancyId,
    enabled: isRefreshing,
    fetchToken: fetchRefreshVacancyResponsesToken,
    onComplete: (success) => {
      // Всегда завершаем состояние обновления, независимо от результата
      handleRefreshComplete();

      // Обрабатываем ошибку отдельно
      if (!success) {
        console.error(
          "Ошибка при обновлении откликов для вакансии:",
          vacancyId,
        );
        // Можно добавить toast уведомление или установить состояние ошибки
      }
    },
  });

  // Подписываемся на события завершения обновления откликов
  useEffect(() => {
    if (!isRefreshing) return;

    let timeoutId: NodeJS.Timeout;

    // Устанавливаем таймаут на случай, если событие завершения не придет
    timeoutId = setTimeout(
      () => {
        handleRefreshComplete();
      },
      5 * 60 * 1000,
    ); // 5 минут максимум

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
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
      return (
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
      );
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
