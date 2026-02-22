"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@qbs-autonaim/ui/components/dropdown-menu";
import { Settings2Icon } from "lucide-react";
import { useMemo } from "react";
import type { ColumnId } from "../types";

interface ColumnVisibilityToggleProps {
  readonly visibleColumns: ReadonlySet<ColumnId>;
  readonly onToggleColumn: (columnId: ColumnId) => void;
  readonly onResetColumns: () => void;
}

const COLUMN_LABELS: Readonly<Record<ColumnId, string>> = {
  candidate: "Кандидат",
  status: "Статус",
  priority: "Приоритет",
  screening: "Скрининг",
  potential: "Потенциал",
  career: "Карьера",
  risks: "Риски",
  salary: "Зарплата",
  skills: "Навыки",
  interview: "Интервью",
  hrSelection: "Отбор HR",
  coverLetter: "Отклик",
  date: "Дата",
  actions: "Действия",
} as const;

const ALWAYS_VISIBLE_COLUMNS: ReadonlySet<ColumnId> = new Set([
  "candidate",
  "actions",
]);

const COLUMN_ENTRIES = Object.entries(COLUMN_LABELS) as ReadonlyArray<
  readonly [ColumnId, string]
>;

export function ColumnVisibilityToggle({
  visibleColumns,
  onToggleColumn,
  onResetColumns,
}: ColumnVisibilityToggleProps) {
  const allColumnsVisible = useMemo(
    () => COLUMN_ENTRIES.every(([columnId]) => visibleColumns.has(columnId)),
    [visibleColumns],
  );

  const isColumnDisabled = (columnId: ColumnId) =>
    ALWAYS_VISIBLE_COLUMNS.has(columnId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2"
          aria-label="Настроить видимость колонок"
        >
          <Settings2Icon className="h-4 w-4" aria-hidden="true" />

          <span className="hidden sm:inline">Колонки</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Видимость колонок</span>
          {!allColumnsVisible && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs font-normal hover:bg-transparent hover:underline"
              onClick={(e) => {
                e.preventDefault();
                onResetColumns();
              }}
              aria-label="Сбросить настройки колонок"
            >
              Сбросить
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {COLUMN_ENTRIES.map(([columnId, label]) => {
          const isVisible = visibleColumns.has(columnId);
          const isDisabled = isColumnDisabled(columnId);

          return (
            <DropdownMenuCheckboxItem
              key={columnId}
              checked={isVisible}
              disabled={isDisabled}
              onCheckedChange={() => {
                if (!isDisabled) {
                  onToggleColumn(columnId);
                }
              }}
              onSelect={(e) => e.preventDefault()}
              aria-label={`${isVisible ? "Скрыть" : "Показать"} колонку ${label}`}
            >
              {label}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
