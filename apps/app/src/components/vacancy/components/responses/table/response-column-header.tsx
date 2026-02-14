"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { HeaderContext } from "@tanstack/react-table";
import type { ResponseListItem } from "./response-columns";
import type { ResponseTableMeta } from "./response-columns";
import type { SortField } from "../types";

interface ResponseColumnHeaderProps {
  context: HeaderContext<ResponseListItem, unknown>;
  label: React.ReactNode;
}

export function ResponseColumnHeader({
  context,
  label,
}: ResponseColumnHeaderProps) {
  const { column, table } = context;
  const meta = table.options.meta as ResponseTableMeta;
  const sortField = (column.columnDef.meta as { sortField?: SortField })
    ?.sortField;

  if (!sortField || !meta.onSort) {
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
      <button
        type="button"
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
