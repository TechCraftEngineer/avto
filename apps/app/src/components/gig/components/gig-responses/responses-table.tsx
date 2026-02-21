"use client";

import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  Card,
  DataGrid,
  DataGridContainer,
  DataGridTableDnd,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@qbs-autonaim/ui";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { memo, useCallback, useMemo, useState } from "react";
import { z } from "zod";
import type { GigSortField } from "./table/gig-column-header";
import {
  createGigResponseColumns,
  type GigResponseListItem,
  type GigTableMeta,
} from "./table/gig-response-columns";

type GigResponseWithScore = GigResponseListItem & { score?: number | null };

const GIG_COLUMN_ORDER_KEY = "gig-responses-column-order";

const DEFAULT_COLUMN_ORDER = [
  "candidate",
  "status",
  "price",
  "delivery",
  "screening",
  "interview",
  "hrSelection",
  "coverLetter",
  "date",
] as const;

const DATA_COLUMN_IDS = [...DEFAULT_COLUMN_ORDER] as readonly string[];

const columnOrderSchema = z.array(z.string()).transform((arr) => {
  const allowedSet = new Set(DATA_COLUMN_IDS);
  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const id of arr) {
    if (allowedSet.has(id) && !seen.has(id)) {
      deduped.push(id);
      seen.add(id);
    }
  }
  return deduped;
});

function loadColumnOrder(): string[] {
  if (typeof window === "undefined") return [...DEFAULT_COLUMN_ORDER];
  try {
    const stored = localStorage.getItem(GIG_COLUMN_ORDER_KEY);
    if (!stored) return [...DEFAULT_COLUMN_ORDER];
    const parsed: unknown = JSON.parse(stored);
    const result = columnOrderSchema.safeParse(parsed);
    if (!result.success) return [...DEFAULT_COLUMN_ORDER];
    const savedOrder = result.data;
    const savedSet = new Set(savedOrder);
    const missingDefaults = DEFAULT_COLUMN_ORDER.filter(
      (id) => !savedSet.has(id),
    );
    return [...savedOrder, ...missingDefaults];
  } catch {
    return [...DEFAULT_COLUMN_ORDER];
  }
}

function saveColumnOrder(order: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GIG_COLUMN_ORDER_KEY, JSON.stringify(order));
  } catch {
    // ignore
  }
}

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
        const scoreA =
          a.interviewScoring != null &&
          typeof a.interviewScoring.score === "number" &&
          Number.isFinite(a.interviewScoring.score)
            ? Math.round((a.interviewScoring.score as number) / 20)
            : -1;
        const scoreB =
          b.interviewScoring != null &&
          typeof b.interviewScoring.score === "number" &&
          Number.isFinite(b.interviewScoring.score)
            ? Math.round((b.interviewScoring.score as number) / 20)
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

export const ResponsesTable = memo(function ResponsesTable({
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
  const [columnOrder, setColumnOrderState] = useState<string[]>(() =>
    loadColumnOrder(),
  );

  const setColumnOrder = useCallback(
    (order: string[] | ((prev: string[]) => string[])) => {
      setColumnOrderState((prev) => {
        const next = typeof order === "function" ? order(prev) : order;
        saveColumnOrder(next);
        return next;
      });
    },
    [],
  );

  const handleSort = useCallback(
    (field: GigSortField) => {
      if (sortField === field) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDirection("desc");
      }
    },
    [sortField],
  );

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

  const fullColumnOrder = useMemo(
    () => [...columnOrder, "actions"] as string[],
    [columnOrder],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || String(active.id) === String(over.id)) return;

      const oldIndex = fullColumnOrder.indexOf(String(active.id));
      const newIndex = fullColumnOrder.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(fullColumnOrder, oldIndex, newIndex);
      const dataOrder = reordered.filter((id) => DATA_COLUMN_IDS.includes(id));
      setColumnOrder(dataOrder);
    },
    [fullColumnOrder, setColumnOrder],
  );

  const table = useReactTable({
    data: sortedResponses,
    columns,
    state: {
      columnOrder: fullColumnOrder,
    },
    onColumnOrderChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(fullColumnOrder) : updater;
      const dataOrder = next.filter((id) => DATA_COLUMN_IDS.includes(id));
      setColumnOrder(dataOrder);
    },
    getCoreRowModel: getCoreRowModel(),
    meta: tableMeta,
  });

  const isEmpty = sortedResponses.length === 0;

  return (
    <Card className="border shadow-sm overflow-hidden">
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
              columnsDraggable: true,
              headerBackground: true,
              headerBorder: true,
              rowBorder: true,
              width: "fixed",
            }}
          >
            <DataGridContainer
              className="bg-background border-0 rounded-none"
              border={false}
            >
              <DataGridTableDnd handleDragEnd={handleDragEnd} />
            </DataGridContainer>
          </DataGrid>
        )}
      </div>
    </Card>
  );
});
