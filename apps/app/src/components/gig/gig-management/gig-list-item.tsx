import { Badge } from "@qbs-autonaim/ui";
import { MessageSquare } from "lucide-react";
import Link from "next/link";

interface GigListItemProps {
  gig: {
    id: string;
    title: string;
    type: string;
    isActive: boolean;
    responses?: number | null;
    views?: number | null;
  };
  orgSlug: string;
  workspaceSlug: string;
  onDelete?: (gigId: string) => void;
}

function getGigTypeLabel(type: string) {
  const types: Record<string, string> = {
    DEVELOPMENT: "Разработка",
    DESIGN: "Дизайн",
    COPYWRITING: "Копирайтинг",
    MARKETING: "Маркетинг",
    OTHER: "Другое",
  };
  return types[type] || type;
}

export function GigListItem({
  gig,
  orgSlug,
  workspaceSlug,
  onDelete: _onDelete,
}: GigListItemProps) {
  return (
    <div className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              {getGigTypeLabel(gig.type)}
            </Badge>

            <Badge
              variant={gig.isActive ? "default" : "outline"}
              className={`text-xs px-1.5 py-0.5 ${gig.isActive ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}`}
            >
              {gig.isActive ? "●" : "○"}
            </Badge>
          </div>

          <Link
            href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gig.id}`}
            className="block hover:text-primary transition-colors"
          >
            <h3 className="font-medium text-sm line-clamp-2 leading-tight">
              {gig.title}
            </h3>
          </Link>
        </div>

        <Link
          href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gig.id}/responses`}
          className="flex items-center gap-1 hover:text-foreground transition-colors text-xs shrink-0"
        >
          <MessageSquare className="h-3.5 w-3.5" />
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
