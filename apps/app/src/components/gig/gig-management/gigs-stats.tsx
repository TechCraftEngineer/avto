import { Skeleton } from "@qbs-autonaim/ui";

import type { GigsStats as GigsStatsType } from "../filters/use-gigs-filters";

interface GigsStatsProps {
  stats: GigsStatsType;
  isLoading: boolean;
}

export function GigsStats({ stats, isLoading }: GigsStatsProps) {
  return (
    <div className="grid gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">Всего заданий</p>
        <p className="text-2xl font-bold tabular-nums">
          {isLoading ? <Skeleton className="h-8 w-16" /> : stats.totalGigs}
        </p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">Активных</p>
        <p className="text-2xl font-bold tabular-nums">
          {isLoading ? <Skeleton className="h-8 w-16" /> : stats.activeGigs}
        </p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">Всего откликов</p>
        <p className="text-2xl font-bold tabular-nums">
          {isLoading ? <Skeleton className="h-8 w-16" /> : stats.totalResponses}
        </p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">Новых откликов</p>
        <p className="text-2xl font-bold tabular-nums text-green-600">
          {isLoading ? <Skeleton className="h-8 w-16" /> : stats.newResponses}
        </p>
      </div>
    </div>
  );
}
