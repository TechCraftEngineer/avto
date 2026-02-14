"use client";

import {
  DataGrid,
  DataGridContainer,
  DataGridTableDnd,
} from "@qbs-autonaim/ui";
import { Table, TableBody, TableCell, TableRow } from "@qbs-autonaim/ui";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState, useCallback } from "react";
import {
  createGigResponseColumns,
  type GigResponseListItem,
  type GigTableMeta,
} from "./table/gig-response-columns";
import type { GigSortField } from "./table/gig-column-header";

type GigResponseWithScore = GigResponseListItem & { score?: number | null };

interface ResponsesTableProps {
  responses: GigResponseWithScore[];
  orgSlug: string;
  workspaceSlug: string;
  gigId: string;
  onAccept: (responseId: string) => void;
  onReject: (responseId: string) => void;
  onMessage: (responseId: string) => void;
  isProcessing: boolean;
}

function sortResponses(
  data: GigResponseWithScore[],
  sortField: GigSortField | null,
  sortDirection: "asc" | "desc",
): GigResponseWithScore[] {
  if (!sortField) return data;

  const sorted = [...data].sort((a, b) => {
    let cmp = 0;

    switch (sortField) {
      case "candidateName": {
        const nameA = (a.candidateName || "").toLowerCase();
        const nameB = (b.candidateName || "").toLowerCase();
        cmp = nameA.localeCompare(nameB);
        break;
      }
      case "status":
        cmp = (a.status || "").localeCompare(b.status || "");
        break;
      case "proposedPrice": {
        const priceA = a.proposedPrice ?? -1;
        const priceB = b.proposedPrice ?? -1;
        cmp = priceA - priceB;
        break;
      }
      case "proposedDeliveryDays": {
        const daysA = a.proposedDeliveryDays ?? -1;
        const daysB = b.proposedDeliveryDays ?? -1;
        cmp = daysA - daysB;
        break;
      }
      case "createdAt": {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        cmp = dateA - dateB;
        break;
      }
      case "screening": {
        const scoreA = a.screening?.overallScore ?? -1;
        const scoreB = b.screening?.overallScore ?? -1;
        cmp = scoreA - scoreB;
        break;
      }
      case "interview": {
        const scoreA = a.interviewScoring?.rating ?? a.interviewScoring
          ? Math.round(a.interviewScoring.score / 20)
          : -1;
        const scoreB = b.interviewScoring?.rating ?? b.interviewScoring
          ? Math.round(b.interviewScoring.score / 20)
          : -1;
        cmp = scoreA - scoreB;
        break;
      }
      default:
        break;
    }

    return sortDirection === "asc" ? cmp : -cmp;
  });

  return sorted;
}

export function ResponsesTable({
  responses,
  orgSlug,
  workspaceSlug,
  gigId,
  onAccept,
  onReject,
  onMessage,
  isProcessing,
}: ResponsesTableProps) {
  const [sortField, setSortField] = useState<GigSortField | null>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = useCallback((field: GigSortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }, [sortField]);

  const sortedResponses = useMemo(
    () => sortResponses(responses, sortField, sortDirection),
    [responses, sortField, sortDirection],
  );

  const tableMeta: GigTableMeta & {
    orgSlug: string;
    workspaceSlug: string;
    gigId: string;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
    onMessage: (id: string) => void;
    isProcessing: boolean;
  } = useMemo(
    () => ({
      sortField,
      sortDirection,
      onSort: handleSort,
      orgSlug,
      workspaceSlug,
      gigId,
      onAccept,
      onReject,
      onMessage,
      isProcessing,
    }),
    [
      sortField,
      sortDirection,
      handleSort,
      orgSlug,
      workspaceSlug,
      gigId,
      onAccept,
      onReject,
      onMessage,
      isProcessing,
    ],
  );

  const columns = useMemo(() => createGigResponseColumns(), []);

  const table = useReactTable({
    data: sortedResponses,
    columns,
    state: {},
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: tableMeta,
  });

  const isEmpty = sortedResponses.length === 0;

  return (
    <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
      <div className="relative w-full overflow-auto">
        {isEmpty ? (
          <Table className="bg-background">
            <TableBody>
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="h-48 text-center text-muted-foreground"
                >
                  Нет откликов
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : (
          <DataGrid
            table={table}
            recordCount={sortedResponses.length}
            isLoading={false}
            emptyMessage={null}
            tableLayout={{
              columnsDraggable: false,
              headerBackground: true,
              headerBorder: true,
              rowBorder: true,
              width: "fixed",
            }}
          >
            <DataGridContainer className="bg-background border-0 rounded-none">
              <DataGridTableDnd handleDragEnd={() => {}} />
            </DataGridContainer>
          </DataGrid>
        )}
      </div>
    </div>
  );
}
