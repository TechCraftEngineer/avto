import { Button } from "@qbs-autonaim/ui/components/button";
import { getStatusLabel } from "./utils";

interface StatusFilterProps {
  statusFilter: string | null;
  uniqueStatuses: string[];
  onFilterChange: (status: string | null) => void;
}

export function StatusFilter({
  statusFilter,
  uniqueStatuses,
  onFilterChange,
}: StatusFilterProps) {
  return (
    <div className="px-6 py-4 border-b bg-muted/30">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Статус:</span>
        <Button
          variant={statusFilter === null ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(null)}
        >
          Все
        </Button>
        {uniqueStatuses.map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(status)}
          >
            {getStatusLabel(status)}
          </Button>
        ))}
      </div>
    </div>
  );
}
