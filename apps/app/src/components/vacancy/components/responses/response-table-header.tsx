import Checkbox from "@qbs-autonaim/ui/checkbox";
import TableHead from "@qbs-autonaim/ui/tablehead";
import TableHeader from "@qbs-autonaim/ui/tableheader";
import TableRow from "@qbs-autonaim/ui/tablerow";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { SortDirection, SortField } from "./types";

interface ResponseTableHeaderProps {
  allSelected: boolean;
  onSelectAll: () => void;
  hasResponses: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

export function ResponseTableHeader({
  allSelected,
  onSelectAll,
  hasResponses,
  sortField,
  sortDirection,
  onSort,
}: ResponseTableHeaderProps) {
  const renderSortIcon = (field: SortField) => {
    if (sortField === field) {
      return sortDirection === "asc" ? (
        <ArrowUp className="h-4 w-4" />
      ) : (
        <ArrowDown className="h-4 w-4" />
      );
    }
    return <ArrowUpDown className="h-4 w-4 opacity-50" />;
  };

  return (
    <TableHeader>
      <TableRow className="bg-muted/50 hover:bg-muted/50">
        <TableHead className="w-10 pl-4">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onSelectAll}
            disabled={!hasResponses}
          />
        </TableHead>
        <TableHead className="font-semibold text-foreground">
          Кандидат
        </TableHead>
        <TableHead className="font-semibold text-foreground">
          <button
            type="button"
            onClick={() => onSort("status")}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            Статус
            {renderSortIcon("status")}
          </button>
        </TableHead>
        <TableHead className="font-semibold text-foreground">
          <button
            type="button"
            onClick={() => onSort("priorityScore")}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
            title="Сортировка по приоритету просмотра"
          >
            Приоритет
            {renderSortIcon("priorityScore")}
          </button>
        </TableHead>
        <TableHead className="font-semibold text-foreground">
          <button
            type="button"
            onClick={() => onSort("detailedScore")}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            Скрининг
            {renderSortIcon("detailedScore")}
          </button>
        </TableHead>
        <TableHead className="font-semibold text-foreground">
          <button
            type="button"
            onClick={() => onSort("potentialScore")}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
            title="Сортировка по потенциалу"
          >
            Потенциал
            {renderSortIcon("potentialScore")}
          </button>
        </TableHead>
        <TableHead className="font-semibold text-foreground">
          <button
            type="button"
            onClick={() => onSort("careerTrajectoryScore")}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
            title="Сортировка по карьерной траектории"
          >
            Карьера
            {renderSortIcon("careerTrajectoryScore")}
          </button>
        </TableHead>
        <TableHead className="font-semibold text-foreground">Риски</TableHead>
        <TableHead className="font-semibold text-foreground">
          Интервью
        </TableHead>
        <TableHead className="font-semibold text-foreground">
          Отбор HR
        </TableHead>
        <TableHead className="font-semibold text-foreground">
          Контакты
        </TableHead>
        <TableHead className="font-semibold text-foreground">Резюме</TableHead>
        <TableHead className="font-semibold text-foreground">Отклик</TableHead>
        <TableHead className="font-semibold text-foreground whitespace-nowrap">
          <button
            type="button"
            onClick={() => onSort("respondedAt")}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            Дата
            {renderSortIcon("respondedAt")}
          </button>
        </TableHead>
        <TableHead className="text-right pr-4 font-semibold text-foreground">
          Действия
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}

