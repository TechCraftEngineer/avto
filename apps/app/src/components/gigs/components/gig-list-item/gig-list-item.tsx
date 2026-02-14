import { Badge } from "@qbs-autonaim/ui";
import { Calendar, MessageSquare } from "lucide-react";
import Link from "next/link";
import {
  formatBudget,
  formatListItemDate,
  getGigTypeLabel,
} from "../gig-detail-utils";

interface GigListItemProps {
  gig: {
    id: string;
    title: string;
    type: string;
    isActive: boolean;
    responses?: number | null;
    newResponses?: number | null;
    views?: number | null;
    deadline?: Date | null;
    budgetMin?: number | null;
    budgetMax?: number | null;
  };
  orgSlug: string;
  workspaceSlug: string;
  onDelete?: (gigId: string) => void;
}

export function GigListItem({
  gig,
  orgSlug,
  workspaceSlug,
  onDelete: _onDelete,
}: GigListItemProps) {
  const budget = formatBudget(gig.budgetMin, gig.budgetMax);
  const isOverdue = gig.deadline && gig.deadline < new Date();

  return (
    <div className="rounded-lg border bg-card p-3 transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">
              {getGigTypeLabel(gig.type)}
            </Badge>

            <Badge
              variant={gig.isActive ? "default" : "outline"}
              className={`px-1.5 py-0.5 text-xs ${gig.isActive ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}`}
            >
              {gig.isActive ? "●" : "○"}
            </Badge>

            {(gig.newResponses ?? 0) > 0 && (
              <Badge
                variant="default"
                className="px-1.5 py-0.5 text-xs bg-orange-100 text-orange-800 hover:bg-orange-200"
              >
                +{gig.newResponses}
              </Badge>
            )}
          </div>

          <Link
            href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gig.id}`}
            className="block transition-colors hover:text-primary"
          >
            <h3 className="line-clamp-2 text-sm font-medium leading-tight">
              {gig.title}
            </h3>
          </Link>

          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {budget && budget !== "Не указан" && (
              <span className="font-medium text-foreground">{budget}</span>
            )}
            {gig.deadline && (
              <span
                className={`flex items-center gap-1 ${isOverdue ? "text-destructive" : ""}`}
              >
                <Calendar className="size-3" />
                {formatListItemDate(gig.deadline)}
              </span>
            )}
          </div>
        </div>

        <Link
          href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gig.id}/responses`}
          className="flex shrink-0 items-center gap-1 text-xs transition-colors hover:text-foreground"
        >
          <MessageSquare className="size-3.5" />
          <span
            className={`font-medium ${
              (gig.responses || 0) > 0
                ? (gig.responses || 0) > 5
                  ? "text-green-600"
                  : "text-blue-600"
                : "text-muted-foreground"
            }`}
          >
            {gig.responses || 0}
          </span>
          {(gig.views || 0) > 0 && (
            <span className="text-muted-foreground">
              ({Math.round(((gig.responses || 0) / (gig.views || 1)) * 100)}%)
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
