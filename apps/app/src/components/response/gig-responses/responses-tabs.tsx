"use client";

import { Tabs, TabsList, TabsTrigger } from "@qbs-autonaim/ui";
import type React from "react";

interface ResponsesTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  stats: {
    total: number;
    new: number;
    evaluated: number;
    recommended: number;
  };
  children: React.ReactNode;
}

export function ResponsesTabs({
  activeTab,
  onTabChange,
  stats,
  children,
}: ResponsesTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1.5 p-1.5 bg-muted/50 rounded-lg mb-6">
        <TabsTrigger
          value="all"
          className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all font-medium"
        >
          <span className="hidden sm:inline">Все ({stats.total})</span>
          <span className="sm:hidden">Все</span>
        </TabsTrigger>
        <TabsTrigger
          value="new"
          className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all font-medium"
        >
          <span className="hidden sm:inline">Новые ({stats.new})</span>
          <span className="sm:hidden">Новые</span>
        </TabsTrigger>
        <TabsTrigger
          value="evaluated"
          className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all font-medium"
        >
          <span className="hidden sm:inline">Оценены ({stats.evaluated})</span>
          <span className="sm:hidden">Оценены</span>
        </TabsTrigger>
        <TabsTrigger
          value="recommended"
          className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all font-medium"
        >
          <span className="hidden sm:inline">
            Рекомендованы ({stats.recommended})
          </span>
          <span className="sm:hidden">Рекоменд.</span>
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}
