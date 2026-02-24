import { Alert, AlertTitle } from "@qbs-autonaim/ui/components/alert";
import { AlertTriangle } from "lucide-react";
import { GigCard } from "../gig-card";
import { GigCompactItem } from "../gig-compact-item";
import type { Gig } from "../gigs-filters";

export type GigWithActive = Gig & { isActive: boolean };

/** grid = карточки, compact = компактные строки (для блока при режиме таблицы) */
type AttentionBlockDisplayMode = "grid" | "compact";

function getAttentionGigs(gigs: GigWithActive[]): GigWithActive[] {
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  const threeDays = 3 * oneDay;

  return gigs.filter((g) => {
    const hasNewResponses = (g.newResponses ?? 0) > 0;
    const isOverdue =
      g.deadline &&
      new Date(g.deadline).getTime() < now.getTime() &&
      g.isActive;
    const isUrgent =
      g.deadline &&
      g.isActive &&
      !isOverdue &&
      new Date(g.deadline).getTime() - now.getTime() <= threeDays &&
      new Date(g.deadline).getTime() - now.getTime() > 0;

    return hasNewResponses || isOverdue || isUrgent;
  });
}

interface GigsAttentionBlockProps {
  gigs: GigWithActive[];
  displayMode: AttentionBlockDisplayMode;
  orgSlug: string;
  workspaceSlug: string;
  onDelete?: (gigId: string) => void;
}

export function GigsAttentionBlock({
  gigs,
  displayMode,
  orgSlug,
  workspaceSlug,
  onDelete,
}: GigsAttentionBlockProps) {
  const attentionGigs = getAttentionGigs(gigs);

  if (attentionGigs.length === 0) return null;

  return (
    <Alert
      variant="default"
      className="mb-4 max-w-3xl border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20"
    >
      <AlertTriangle className="size-4 shrink-0" />
      <AlertTitle className="text-amber-800 dark:text-amber-200">
        Требуют внимания ({attentionGigs.length})
      </AlertTitle>
      <div
        className={
          displayMode === "grid"
            ? "col-start-2 mt-2 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2"
            : "col-start-2 mt-2 space-y-1.5"
        }
      >
        {attentionGigs.map((gig) =>
          displayMode === "compact" ? (
            <GigCompactItem
              key={gig.id}
              gig={gig}
              orgSlug={orgSlug}
              workspaceSlug={workspaceSlug}
              onDelete={onDelete}
            />
          ) : (
            <GigCard
              key={gig.id}
              gig={gig}
              orgSlug={orgSlug}
              workspaceSlug={workspaceSlug}
              onDelete={onDelete}
            />
          ),
        )}
      </div>
    </Alert>
  );
}
