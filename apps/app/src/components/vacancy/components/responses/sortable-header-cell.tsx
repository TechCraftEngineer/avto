import { TableHead } from "@qbs-autonaim/ui/table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { memo } from "react";
import type { SortDirection, SortField } from "./types";

interface SortableHeaderCellProps {
  readonly field: SortField;
  readonly label: string;
  readonly currentSortField: SortField;
  readonly currentSortDirection: SortDirection;
  readonly onSort: (field: SortField) => void;
  readonly tooltip?: React.ReactNode;
}

function SortableHeaderCellComponent({
  field,
  label,
  currentSortField,
  currentSortDirection,
  onSort,
  tooltip,
}: SortableHeaderCellProps) {
  const isActive = currentSortField === field;
  const sortLabel = isActive
    ? `Сортировка по ${label.toLowerCase()}: ${currentSortDirection === "asc" ? "по возрастанию" : "по убыванию"}. Нажмите для изменения направления`
    : `Сортировать по ${label.toLowerCase()}`;

  const SortIcon = isActive
    ? currentSortDirection === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  const ariaSortValue = isActive
    ? currentSortDirection === "asc"
      ? ("ascending" as const)
      : ("descending" as const)
    : ("none" as const);

  return (
    <TableHead
      className="font-semibold text-foreground"
      aria-sort={ariaSortValue}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onSort(field)}
          className="flex items-center gap-1 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm px-1 -mx-1 min-h-[24px]"
          aria-label={sortLabel}
        >
          {label}
          <SortIcon
            className={`h-4 w-4 ${!isActive ? "opacity-50" : ""}`}
            aria-hidden="true"
          />
        </button>
        {tooltip}
      </div>
    </TableHead>
  );
}

export const SortableHeaderCell = memo(SortableHeaderCellComponent);
