"use client";

import { Button, cn } from "@qbs-autonaim/ui";
import { LayoutGrid, List } from "lucide-react";
import type { ViewMode } from "../../types/types";

interface ViewSwitcherProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function ViewSwitcher({ view, onViewChange }: ViewSwitcherProps) {
  return (
    <div className="flex items-center border rounded-lg p-1 bg-muted/30">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 px-3 gap-2",
          view === "table" && "bg-background shadow-sm",
        )}
        onClick={() => onViewChange("table")}
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">Таблица</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 px-3 gap-2",
          view === "cards" && "bg-background shadow-sm",
        )}
        onClick={() => onViewChange("cards")}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">Карточки</span>
      </Button>
    </div>
  );
}
