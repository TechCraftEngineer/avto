"use client";

import { paths } from "@qbs-autonaim/config";
import type { Workspace } from "@qbs-autonaim/db";
import { Avatar, AvatarFallback, AvatarImage, Card } from "@qbs-autonaim/ui";
import { Building2, ExternalLink } from "lucide-react";
import Link from "next/link";

interface WorkspaceCardProps {
  workspace: Workspace;
  organizationSlug: string;
}

export function WorkspaceCard({
  workspace,
  organizationSlug,
}: WorkspaceCardProps) {
  const workspaceUrl = paths.workspace.root(organizationSlug, workspace.slug);
  const initials = workspace.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link href={workspaceUrl}>
      <Card className="group relative overflow-hidden transition-all hover:shadow-md">
        <div className="p-6">
          <div className="mb-4 flex items-start justify-between">
            <Avatar className="h-12 w-12">
              {workspace.logo ? (
                <AvatarImage src={workspace.logo} alt={workspace.name} />
              ) : null}
              <AvatarFallback>
                {initials || <Building2 className="h-6 w-6" />}
              </AvatarFallback>
            </Avatar>
            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>

          <h3 className="mb-2 text-lg font-semibold">{workspace.name}</h3>

          {workspace.description && (
            <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">
              {workspace.description}
            </p>
          )}

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">
              /{workspace.slug}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
