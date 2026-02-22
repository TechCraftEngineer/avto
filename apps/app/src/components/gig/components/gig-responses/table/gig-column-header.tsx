"use client";

import type { SortDirection } from "@qbs-autonaim/shared";
import type { HeaderContext } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

export type GigSortField =
  | "candidateName"
  | "status"
  | "proposedPrice"
  | "proposedDeliveryDays"
  | "createdAt"
  | "screening"
  | "interview";

export interface GigTableMeta {
  sortField: GigSortField | null;
  sortDirection: SortDirection;
  onSort: (field: GigSortField) => void;
}

interface GigColumnHeaderProps {
  // biome-ignore lint/suspicious/noExplicitAny: HeaderContext is invariant, need to accept specific table row types
  context: HeaderContext<any, unknown>;
  label: React.ReactNode;
  sortField?: GigSortField;
  meta: GigTableMeta | undefined;
}

export function GigColumnHeader({
  context: _context,
  label,
  sortField,
  meta,
}: GigColumnHeaderProps) {
  if (!sortField || !meta?.onSort) {
    return <div className="font-semibold text-foreground">{label}</div>;
  }

  const isActive = meta.sortField === sortField;
  const sortLabel = isActive
    ? `Сортировка: ${meta.sortDirection === "asc" ? "по возрастанию" : "по убыванию"}. Нажмите для изменения`
    : "Нажмите для сортировки";

  const SortIcon = isActive
    ? meta.sortDirection === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <div className="flex items-center gap-1.5 font-semibold text-foreground">
      {/* biome-ignore lint/a11y/useSemanticElements: button required for sort click; role and aria-sort needed for table header semantics */}
      <button
        type="button"
        role="columnheader"
        onClick={() => meta.onSort(sortField)}
        className="flex items-center gap-1 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm px-1 -mx-1 min-h-[24px]"
        aria-label={sortLabel}
        aria-sort={
          isActive
            ? meta.sortDirection === "asc"
              ? "ascending"
              : "descending"
            : "none"
        }
      >
        {label}
        <SortIcon
          className={`h-4 w-4 ${!isActive ? "opacity-50" : ""}`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
