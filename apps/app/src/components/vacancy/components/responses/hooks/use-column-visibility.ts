"use client";

import { useCallback, useEffect, useState } from "react";
import type { ColumnId } from "../types";

const STORAGE_KEY = "vacancy-responses-column-visibility";
const ORDER_STORAGE_KEY = "vacancy-responses-column-order";
const REQUIRED_COLUMN: ColumnId = "candidate";

const DEFAULT_COLUMN_ORDER: readonly ColumnId[] = [
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
] as const;

const DEFAULT_VISIBLE_COLUMNS: ReadonlySet<ColumnId> = new Set([
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
] as const);

function isValidColumnId(value: unknown): value is ColumnId {
  const validColumns: readonly ColumnId[] = [
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
  return typeof value === "string" && validColumns.includes(value as ColumnId);
}

function loadVisibleColumns(): Set<ColumnId> {
  if (typeof window === "undefined") {
    return new Set(DEFAULT_VISIBLE_COLUMNS);
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return new Set(DEFAULT_VISIBLE_COLUMNS);
    }

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return new Set(DEFAULT_VISIBLE_COLUMNS);
    }

    const validColumns = parsed.filter(isValidColumnId);
    const columns = new Set(validColumns);

    // Всегда включаем обязательную колонку
    columns.add(REQUIRED_COLUMN);

    return columns;
  } catch (error) {
    console.error("Ошибка загрузки настроек видимости колонок:", error);
    return new Set(DEFAULT_VISIBLE_COLUMNS);
  }
}

function saveVisibleColumns(columns: Set<ColumnId>): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...columns]));
  } catch (error) {
    console.error("Ошибка сохранения настроек видимости колонок:", error);
  }
}

function loadColumnOrder(): ColumnId[] {
  if (typeof window === "undefined") {
    return [...DEFAULT_COLUMN_ORDER];
  }

  try {
    const stored = localStorage.getItem(ORDER_STORAGE_KEY);
    if (!stored) return [...DEFAULT_COLUMN_ORDER];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [...DEFAULT_COLUMN_ORDER];
    return parsed.filter(isValidColumnId);
  } catch {
    return [...DEFAULT_COLUMN_ORDER];
  }
}

function saveColumnOrder(order: ColumnId[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
  } catch (error) {
    console.error("Ошибка сохранения порядка колонок:", error);
  }
}

export interface UseColumnVisibilityReturn {
  readonly visibleColumns: ReadonlySet<ColumnId>;
  readonly isHydrated: boolean;
  readonly toggleColumn: (columnId: ColumnId) => void;
  readonly resetColumns: () => void;
  readonly isColumnVisible: (columnId: ColumnId) => boolean;
  readonly columnOrder: ColumnId[];
  readonly setColumnOrder: (
    order: ColumnId[] | ((prev: ColumnId[]) => ColumnId[]),
  ) => void;
}

export function useColumnVisibility(): UseColumnVisibilityReturn {
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnId>>(
    () => new Set(DEFAULT_VISIBLE_COLUMNS),
  );
  const [columnOrder, setColumnOrderState] = useState<ColumnId[]>(
    () => DEFAULT_COLUMN_ORDER as ColumnId[],
  );
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setVisibleColumns(loadVisibleColumns());
    setColumnOrderState(loadColumnOrder());
    setIsHydrated(true);
  }, []);

  const setColumnOrder = useCallback(
    (updater: ColumnId[] | ((prev: ColumnId[]) => ColumnId[])) => {
      setColumnOrderState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        saveColumnOrder(next);
        return next;
      });
    },
    [],
  );

  const toggleColumn = useCallback((columnId: ColumnId) => {
    if (columnId === REQUIRED_COLUMN) {
      return;
    }

    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      saveVisibleColumns(next);
      return next;
    });
  }, []);

  const resetColumns = useCallback(() => {
    const defaultColumns = new Set(DEFAULT_VISIBLE_COLUMNS);
    const defaultOrder = [...DEFAULT_COLUMN_ORDER];
    setVisibleColumns(defaultColumns);
    setColumnOrderState(defaultOrder);
    saveVisibleColumns(defaultColumns);
    saveColumnOrder(defaultOrder);
  }, []);

  const isColumnVisible = useCallback(
    (columnId: ColumnId): boolean => {
      return visibleColumns.has(columnId);
    },
    [visibleColumns],
  );

  return {
    visibleColumns,
    isHydrated,
    toggleColumn,
    resetColumns,
    isColumnVisible,
    columnOrder,
    setColumnOrder,
  };
}
