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
    "rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50";
  const clickableClass = onCardClick ? "cursor-pointer" : "";

  return (
    <div className="grid gap-4 px-4 sm:grid-cols-2 lg:grid-cols-5 lg:px-6">
      <div
        className={`${cardClass} ${clickableClass}`}
        onClick={() => onCardClick?.("total")}
        onKeyDown={(e) =>
          onCardClick &&
          (e.key === "Enter" || e.key === " ") &&
          (e.preventDefault(), onCardClick("total"))
        }
        role={onCardClick ? "button" : undefined}
        tabIndex={onCardClick ? 0 : undefined}
      >
        <p className="text-sm text-muted-foreground">Всего заданий</p>
        <div className="text-2xl font-bold tabular-nums">
          {isLoading ? <Skeleton className="h-8 w-16" /> : stats.totalGigs}
        </div>
      </div>
      <div
        className={`${cardClass} ${clickableClass}`}
        onClick={() => onCardClick?.("active")}
        onKeyDown={(e) =>
          onCardClick &&
          (e.key === "Enter" || e.key === " ") &&
          (e.preventDefault(), onCardClick("active"))
        }
        role={onCardClick ? "button" : undefined}
        tabIndex={onCardClick ? 0 : undefined}
      >
        <p className="text-sm text-muted-foreground">Активных</p>
        <div className="text-2xl font-bold tabular-nums">
          {isLoading ? <Skeleton className="h-8 w-16" /> : stats.activeGigs}
        </div>
      </div>
      <div
        className={`${cardClass} ${clickableClass}`}
        onClick={() => onCardClick?.("responses")}
        onKeyDown={(e) =>
          onCardClick &&
          (e.key === "Enter" || e.key === " ") &&
          (e.preventDefault(), onCardClick("responses"))
        }
        role={onCardClick ? "button" : undefined}
        tabIndex={onCardClick ? 0 : undefined}
      >
        <p className="text-sm text-muted-foreground">Всего откликов</p>
        <div className="text-2xl font-bold tabular-nums">
          {isLoading ? <Skeleton className="h-8 w-16" /> : stats.totalResponses}
        </div>
      </div>
      <div
        className={`${cardClass} ${clickableClass}`}
        onClick={() => onCardClick?.("newResponses")}
        onKeyDown={(e) =>
          onCardClick &&
          (e.key === "Enter" || e.key === " ") &&
          (e.preventDefault(), onCardClick("newResponses"))
        }
        role={onCardClick ? "button" : undefined}
        tabIndex={onCardClick ? 0 : undefined}
      >
        <p className="text-sm text-muted-foreground">Новых откликов</p>
        <div className="text-2xl font-bold tabular-nums text-green-600">
          {isLoading ? <Skeleton className="h-8 w-16" /> : stats.newResponses}
        </div>
      </div>
      <div
        className={`${cardClass} ${clickableClass} ${stats.overdueCount > 0 ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20" : ""}`}
        onClick={() => onCardClick?.("overdue")}
        onKeyDown={(e) =>
          onCardClick &&
          (e.key === "Enter" || e.key === " ") &&
          (e.preventDefault(), onCardClick("overdue"))
        }
        role={onCardClick ? "button" : undefined}
        tabIndex={onCardClick ? 0 : undefined}
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
      </div>
    </div>
  );
}
