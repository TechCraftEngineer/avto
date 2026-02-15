import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@qbs-autonaim/ui";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { IMPORT_SOURCE_LABELS } from "~/lib/shared/response-configs";
import { formatListItemDate, getGigTypeLabel } from "../gig-detail-utils";

const getPlatformDisplayName = (source: string) =>
  IMPORT_SOURCE_LABELS[source] || source;

interface GigCompactItemProps {
  gig: {
    id: string;
    title: string;
    type: string;
    isActive: boolean;
    responses?: number | null;
    newResponses?: number | null;
    deadline?: Date | null;
    source: string;
    url?: string | null;
  };
  orgSlug: string;
  workspaceSlug: string;
  onDelete?: (gigId: string) => void;
}

export function GigCompactItem({
  gig,
  orgSlug,
  workspaceSlug,
  onDelete,
}: GigCompactItemProps) {
  const isOverdue = gig.deadline && gig.deadline < new Date();

  return (
    <div className="flex items-center gap-2 rounded-md border bg-card shadow-sm px-3 py-2 transition-all hover:bg-muted/60 hover:shadow">
      <Link
        href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gig.id}`}
        className="min-w-0 flex-1 truncate text-sm font-medium transition-colors hover:text-primary"
      >
        {gig.title}
      </Link>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant="secondary" className="px-1.5 py-0 text-xs">
          {getGigTypeLabel(gig.type)}
        </Badge>
        <span
          className={`text-xs tabular-nums ${
            (gig.responses || 0) > 0
              ? "font-medium text-blue-600"
              : "text-muted-foreground"
          }`}
        >
          {gig.responses || 0}
        </span>
        {(gig.newResponses ?? 0) > 0 && (
          <Badge
            variant="default"
            className="px-1.5 py-0 text-xs bg-orange-100 text-orange-800"
          >
            +{gig.newResponses}
          </Badge>
        )}
        {gig.deadline && (
          <span
            className={`text-xs text-muted-foreground ${isOverdue ? "text-destructive" : ""}`}
            title={gig.deadline.toLocaleDateString("ru-RU")}
          >
            {formatListItemDate(gig.deadline)}
          </span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link
                href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gig.id}`}
              >
                Открыть
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gig.id}/responses`}
              >
                Отклики ({gig.responses || 0})
              </Link>
            </DropdownMenuItem>
            {gig.url && (
              <DropdownMenuItem asChild>
                <a href={gig.url} target="_blank" rel="noopener noreferrer">
                  На {getPlatformDisplayName(gig.source)}
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete?.(gig.id)}
            >
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
