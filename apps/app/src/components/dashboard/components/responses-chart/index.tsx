"use client";

import dynamic from "next/dynamic";

export const ResponsesChart = dynamic(
  () => import("./responses-chart"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] animate-pulse bg-muted rounded-lg flex items-center justify-center">
        <div className="text-muted-foreground">Загрузка статистики...</div>
      </div>
    ),
  }
);
