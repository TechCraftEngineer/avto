import { Card, CardContent } from "@qbs-autonaim/ui/components/card";
import { Skeleton } from "@qbs-autonaim/ui/components/skeleton";

import type { GigsStats as GigsStatsType } from "../gigs-filters";

interface GigsStatsProps {
  stats: GigsStatsType;
  isLoading: boolean;
  onCardClick?: (
    card: "total" | "active" | "responses" | "newResponses" | "overdue",
  ) => void;
}

export function GigsStats({ stats, isLoading, onCardClick }: GigsStatsProps) {
  const cardProps = (
    card: "total" | "active" | "responses" | "newResponses" | "overdue",
  ) =>
    onCardClick
      ? {
          role: "button" as const,
          tabIndex: 0,
          onClick: () => onCardClick(card),
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onCardClick(card);
            }
          },
        }
      : {};

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Card
        size="sm"
        className={
          onCardClick
            ? "cursor-pointer transition-shadow hover:bg-muted/60 hover:shadow-md"
            : ""
        }
        {...cardProps("total")}
      >
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">Всего заданий</p>
          <div className="text-2xl font-bold tabular-nums">
            {isLoading ? <Skeleton className="h-8 w-16" /> : stats.totalGigs}
          </div>
        </CardContent>
      </Card>
      <Card
        size="sm"
        className={
          onCardClick
            ? "cursor-pointer transition-shadow hover:bg-muted/60 hover:shadow-md"
            : ""
        }
        {...cardProps("active")}
      >
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">Активных</p>
          <div className="text-2xl font-bold tabular-nums">
            {isLoading ? <Skeleton className="h-8 w-16" /> : stats.activeGigs}
          </div>
        </CardContent>
      </Card>
      <Card
        size="sm"
        className={
          onCardClick
            ? "cursor-pointer transition-shadow hover:bg-muted/60 hover:shadow-md"
            : ""
        }
        {...cardProps("responses")}
      >
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">Всего откликов</p>
          <div className="text-2xl font-bold tabular-nums">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              stats.totalResponses
            )}
          </div>
        </CardContent>
      </Card>
      <Card
        size="sm"
        className={
          onCardClick
            ? "cursor-pointer transition-shadow hover:bg-muted/60 hover:shadow-md"
            : ""
        }
        {...cardProps("newResponses")}
      >
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">Новых откликов</p>
          <div className="text-2xl font-bold tabular-nums text-chart-2">
            {isLoading ? <Skeleton className="h-8 w-16" /> : stats.newResponses}
          </div>
        </CardContent>
      </Card>
      <Card
        size="sm"
        className={[
          onCardClick &&
            "cursor-pointer transition-shadow hover:bg-muted/60 hover:shadow-md",
          (stats.overdueCount ?? 0) > 0 &&
            "border border-destructive/30 bg-destructive/5 hover:bg-destructive/10",
        ]
          .filter(Boolean)
          .join(" ")}
        {...cardProps("overdue")}
      >
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">Просрочено</p>
          <div
            className={`text-2xl font-bold tabular-nums ${(stats.overdueCount ?? 0) > 0 ? "text-destructive" : ""}`}
          >
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              (stats.overdueCount ?? 0)
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
