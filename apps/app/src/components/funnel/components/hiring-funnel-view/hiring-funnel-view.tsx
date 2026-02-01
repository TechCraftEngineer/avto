"use client";

import { Button } from "@qbs-autonaim/ui";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { useState } from "react";
import { FunnelAnalytics } from "./funnel-analytics";
import { FunnelBoard } from "./funnel-board";

export function HiringFunnelView() {
  const [currentView, setCurrentView] = useState<"board" | "analytics">(
    "board",
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {currentView === "board"
            ? "Управление процессом найма"
            : "Аналитика и метрики"}
        </p>

        <nav className="flex items-center gap-2">
          {currentView === "board" ? (
            <Button
              onClick={() => setCurrentView("analytics")}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Аналитика</span>
              <span className="sm:hidden">Статистика</span>
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentView("board")}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">К доске кандидатов</span>
              <span className="sm:hidden">Назад</span>
            </Button>
          )}
        </nav>
      </div>

      {currentView === "board" ? <FunnelBoard /> : <FunnelAnalytics />}
    </div>
  );
}
