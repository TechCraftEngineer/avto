import {
  Badge,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@qbs-autonaim/ui";
import { IconCheck, IconFilter } from "@tabler/icons-react";
import type { ResponseStatusFilterUI } from "../hooks/use-response-table";

interface ResponseStatusFilterProps {
  selectedStatuses: ResponseStatusFilterUI[];
  onStatusChange: (statuses: ResponseStatusFilterUI[]) => void;
}

const statusOptions: Array<{ value: ResponseStatusFilterUI; label: string }> = [
  { value: "NEW", label: "Новые" },
  { value: "EVALUATED", label: "Оценены" },
  { value: "INTERVIEW", label: "Собеседование" },
  { value: "NEGOTIATION", label: "Переговоры" },
  { value: "COMPLETED", label: "Завершены" },
  { value: "SKIPPED", label: "Пропущены" },
];

export function ResponseStatusFilter({
  selectedStatuses,
  onStatusChange,
}: ResponseStatusFilterProps) {
  const toggleStatus = (status: ResponseStatusFilterUI) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter((s) => s !== status));
    } else {
      onStatusChange([...selectedStatuses, status]);
    }
  };

  const clearAll = () => {
    onStatusChange([]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2">
          <IconFilter className="size-4" />
          <span>Статус</span>
          {selectedStatuses.length > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {selectedStatuses.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-sm font-semibold">Фильтр по статусу</span>
            {selectedStatuses.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              >
                Сбросить
              </Button>
            )}
          </div>
          {statusOptions.map((option) => {
            const isSelected = selectedStatuses.includes(option.value);
            return (
              <Button
                key={option.value}
                variant="ghost"
                size="sm"
                onClick={() => toggleStatus(option.value)}
                className="w-full justify-start gap-2 h-8"
              >
                <div className="flex size-4 items-center justify-center rounded border">
                  {isSelected && <IconCheck className="size-3" />}
                </div>
                <span className="flex-1 text-left">{option.label}</span>
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
