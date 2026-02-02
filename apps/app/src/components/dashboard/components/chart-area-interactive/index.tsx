import dynamic from "next/dynamic";

export const ChartAreaInteractive = dynamic(
  () => import("./chart-area-interactive"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] animate-pulse bg-muted rounded-lg flex items-center justify-center">
        <div className="text-muted-foreground">Загрузка графика...</div>
      </div>
    ),
  }
);
