import { AlertTriangle } from "lucide-react";
import { GigCompactItem } from "../gig-compact-item";
import { GigListItem } from "../gig-list-item";
import type { DisplayMode, Gig } from "../gigs-filters";

export type GigWithActive = Gig & { isActive: boolean };

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
  displayMode: DisplayMode;
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
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200">
        <AlertTriangle className="size-4 shrink-0" />
        Требуют внимания ({attentionGigs.length})
      </div>
      <div className="space-y-1.5">
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
            <GigListItem
              key={gig.id}
              gig={gig}
              orgSlug={orgSlug}
              workspaceSlug={workspaceSlug}
              onDelete={onDelete}
            />
          ),
        )}
      </div>
    </div>
  );
}
