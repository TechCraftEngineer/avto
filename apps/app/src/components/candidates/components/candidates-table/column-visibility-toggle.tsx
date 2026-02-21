"use client";

import { Button } from "@qbs-autonaim/ui/components/button"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@qbs-autonaim/ui/components/dropdown-menu";
import { Settings2 } from "lucide-react";

export interface ColumnVisibility {
  vacancy: boolean;
  experience: boolean;
  location: boolean;
  matchScore: boolean;
  salary: boolean;
  email: boolean;
  phone: boolean;
  telegram: boolean;
  createdAt: boolean;
}

interface ColumnVisibilityToggleProps {
  visibility: ColumnVisibility;
  onVisibilityChange: (visibility: ColumnVisibility) => void;
}

const COLUMN_LABELS: Record<keyof ColumnVisibility, string> = {
  vacancy: "Вакансия",
  experience: "Опыт",
  location: "Локация",
  matchScore: "Совпадение",
  salary: "Зарплата",
  email: "Email",
  phone: "Телефон",
  telegram: "Telegram",
  createdAt: "Дата отклика",
};

export function ColumnVisibilityToggle({
  visibility,
  onVisibilityChange,
}: ColumnVisibilityToggleProps) {
  const handleToggle = (column: keyof ColumnVisibility) => {
    onVisibilityChange({
      ...visibility,
      [column]: !visibility[column],
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2"
          aria-label="Настроить видимость колонок"
        >
          <Settings2 className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Колонки</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Видимость колонок</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(COLUMN_LABELS) as Array<keyof ColumnVisibility>).map(
          (column) => (
            <DropdownMenuCheckboxItem
              key={column}
              checked={visibility[column]}
              onCheckedChange={() => handleToggle(column)}
            >
              {COLUMN_LABELS[column]}
            </DropdownMenuCheckboxItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
