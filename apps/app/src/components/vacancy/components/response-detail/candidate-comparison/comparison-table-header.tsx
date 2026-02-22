import { Button } from "@qbs-autonaim/ui/components/button";
import {
  TableHead,
  TableHeader,
  TableRow,
} from "@qbs-autonaim/ui/components/table";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Award,
  Clock,
  Star,
} from "lucide-react";
import type { SortDirection, SortField } from "./types";

interface ComparisonTableHeaderProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

export function ComparisonTableHeader({
  sortField,
  sortDirection,
  onSort,
}: ComparisonTableHeaderProps) {
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    );
  };

  return (
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        <TableHead className="w-56">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 font-semibold"
            onClick={() => onSort("name")}
          >
            Кандидат
            <SortIcon field="name" />
          </Button>
        </TableHead>
        <TableHead className="text-center w-32">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 font-semibold mx-auto"
            onClick={() => onSort("matchScore")}
          >
            <Award className="h-4 w-4" />
            Соответствие
            <SortIcon field="matchScore" />
          </Button>
        </TableHead>
        <TableHead className="text-center w-40">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 font-semibold mx-auto"
            onClick={() => onSort("salary")}
          >
            <Star className="h-4 w-4" />
            Зарплата
            <SortIcon field="salary" />
          </Button>
        </TableHead>
        <TableHead className="text-center w-32">
          <div className="flex items-center justify-center gap-1 font-semibold">
            Опыт
          </div>
        </TableHead>
        <TableHead className="text-center w-28">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 font-semibold mx-auto"
            onClick={() => onSort("responseTime")}
          >
            <Clock className="h-4 w-4" />
            Отклик
            <SortIcon field="responseTime" />
          </Button>
        </TableHead>
        <TableHead className="text-center w-32">
          <div className="flex items-center justify-center gap-1 font-semibold">
            <Activity className="h-4 w-4" />
            Активность
          </div>
        </TableHead>
        <TableHead className="text-center w-36">
          <div className="flex items-center justify-center gap-1 font-semibold">
            Статус
          </div>
        </TableHead>
        <TableHead className="min-w-64">
          <div className="font-semibold">Навыки</div>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
