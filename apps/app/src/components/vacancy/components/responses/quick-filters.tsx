import { Badge } from "@qbs-autonaim/ui/badge";
import { Button } from "@qbs-autonaim/ui/button";
import {
  IconCheck,
  IconClock,
  IconPhone,
  IconStar,
  IconX,
} from "@tabler/icons-react";

export type QuickFilterType =
  | "all"
  | "top"
  | "new"
  | "attention"
  | "suitable"
  | "unsuitable"
  | "with-contacts";

interface QuickFiltersProps {
  activeFilter: QuickFilterType;
  onFilterChange: (filter: QuickFilterType) => void;
  counts?: {
    all: number;
    top: number;
    new: number;
    attention: number;
    suitable: number;
    unsuitable: number;
    withContacts: number;
  };
}

/**
 * Быстрые фильтры для откликов
 * Позволяют рекрутеру быстро переключаться между важными группами кандидатов
 */
export function QuickFilters({
  activeFilter,
  onFilterChange,
  counts,
}: QuickFiltersProps) {
  const filters = [
    {
      id: "all" as const,
      label: "Все отклики",
      icon: null,
      count: counts?.all,
      variant: "outline" as const,
    },
    {
      id: "top" as const,
      label: "Топ-кандидаты",
      icon: IconStar,
      count: counts?.top,
      variant: "default" as const,
      description: "Приоритет ≥ 80",
    },
    {
      id: "new" as const,
      label: "Новые",
      icon: IconClock,
      count: counts?.new,
      variant: "secondary" as const,
      description: "Требуют оценки",
    },
    {
      id: "attention" as const,
      label: "Требуют внимания",
      icon: IconClock,
      count: counts?.attention,
      variant: "destructive" as const,
      description: "Новые + высокий приоритет",
    },
    {
      id: "suitable" as const,
      label: "Подходящие",
      icon: IconCheck,
      count: counts?.suitable,
      variant: "outline" as const,
      description: "Общий балл ≥ 70",
    },
    {
      id: "unsuitable" as const,
      label: "Не подходят",
      icon: IconX,
      count: counts?.unsuitable,
      variant: "outline" as const,
      description: "Общий балл < 50",
    },
    {
      id: "with-contacts" as const,
      label: "С контактами",
      icon: IconPhone,
      count: counts?.withContacts,
      variant: "outline" as const,
      description: "Есть телефон или Telegram",
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-semibold text-foreground">
          Быстрые фильтры:
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.id;

          return (
            <Button
              key={filter.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange(filter.id)}
              className={`h-9 gap-2 ${
                isActive ? "shadow-sm" : "hover:bg-muted/50"
              }`}
              title={filter.description}
            >
              {Icon && <Icon className="size-4" />}
              <span className="font-medium">{filter.label}</span>
              {filter.count !== undefined && filter.count > 0 && (
                <Badge
                  variant={isActive ? "secondary" : "outline"}
                  className="ml-1 px-1.5 py-0 text-xs font-bold min-w-[20px] justify-center"
                >
                  {filter.count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
