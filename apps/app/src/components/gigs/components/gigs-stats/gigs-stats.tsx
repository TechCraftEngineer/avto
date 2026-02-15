import { Skeleton } from "@qbs-autonaim/ui";

import type { GigsStats as GigsStatsType } from "../gigs-filters";

interface GigsStatsProps {
  stats: GigsStatsType;
  isLoading: boolean;
  onCardClick?: (
    card: "total" | "active" | "responses" | "newResponses" | "overdue",
  ) => void;
}

export function GigsStats({ stats, isLoading, onCardClick }: GigsStatsProps) {
  const cardClass =
    "rounded-lg border bg-card shadow-sm p-4 transition-all hover:bg-muted/60 hover:shadow-md w-full text-left";
  const clickableClass = onCardClick ? "cursor-pointer" : "";

  const cardProps = (
    card: "total" | "active" | "responses" | "newResponses" | "overdue",
  ) =>
    onCardClick
      ? {
          type: "button" as const,
          onClick: () => onCardClick(card),
        }
      : {};

  const Card = onCardClick ? "button" : "div";

  return (
    <div className="grid gap-4 px-4 sm:grid-cols-2 lg:grid-cols-5 lg:px-6">
      <Card
        className={`${cardClass} ${clickableClass}`}
        {...cardProps("total")}
      >
        <p className="text-sm text-muted-foreground">Всего заданий</p>
        <div className="text-2xl font-bold tabular-nums">
          {isLoading ? <Skeleton className="h-8 w-16" /> : stats.totalGigs}
        </div>
      </Card>
      <Card
        className={`${cardClass} ${clickableClass}`}
        {...cardProps("active")}
      >
        <p className="text-sm text-muted-foreground">Активных</p>
        <div className="text-2xl font-bold tabular-nums">
          {isLoading ? <Skeleton className="h-8 w-16" /> : stats.activeGigs}
        </div>
      </Card>
      <Card
        className={`${cardClass} ${clickableClass}`}
        {...cardProps("responses")}
      >
        <p className="text-sm text-muted-foreground">Всего откликов</p>
        <div className="text-2xl font-bold tabular-nums">
          {isLoading ? <Skeleton className="h-8 w-16" /> : stats.totalResponses}
        </div>
      </Card>
      <Card
        className={`${cardClass} ${clickableClass}`}
        {...cardProps("newResponses")}
      >
        <p className="text-sm text-muted-foreground">Новых откликов</p>
        <div className="text-2xl font-bold tabular-nums text-green-600">
          {isLoading ? <Skeleton className="h-8 w-16" /> : stats.newResponses}
        </div>
      </Card>
      <Card
        className={`${cardClass} ${clickableClass} ${stats.overdueCount > 0 ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20" : ""}`}
        {...cardProps("overdue")}
      >
        <p className="text-sm text-muted-foreground">Просрочено</p>
        <div
          className={`text-2xl font-bold tabular-nums ${stats.overdueCount > 0 ? "text-destructive" : ""}`}
        >
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            (stats.overdueCount ?? 0)
          )}
        </div>
      </Card>
    </div>
  );
}
