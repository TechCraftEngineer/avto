"use client";

import { useCallback, useEffect, useState } from "react";
import type { ColumnId } from "./types";

const STORAGE_KEY = "vacancy-responses-column-visibility";
const REQUIRED_COLUMN: ColumnId = "candidate";

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
  "score",
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
    "score",
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

export interface UseColumnVisibilityReturn {
  readonly visibleColumns: ReadonlySet<ColumnId>;
  readonly isHydrated: boolean;
  readonly toggleColumn: (columnId: ColumnId) => void;
  readonly resetColumns: () => void;
  readonly isColumnVisible: (columnId: ColumnId) => boolean;
}

export function useColumnVisibility(): UseColumnVisibilityReturn {
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnId>>(
    () => new Set(DEFAULT_VISIBLE_COLUMNS),
  );
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setVisibleColumns(loadVisibleColumns());
    setIsHydrated(true);
  }, []);

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
    setVisibleColumns(defaultColumns);
    saveVisibleColumns(defaultColumns);
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
  };
}
