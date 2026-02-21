"use client";

import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@qbs-autonaim/ui";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { IMPORT_SOURCE_LABELS } from "~/lib/shared/response-configs";
import {
  formatBudget,
  formatListItemDate,
  getGigTypeLabel,
} from "../gig-detail-utils";

const getPlatformDisplayName = (source: string) =>
  IMPORT_SOURCE_LABELS[source] || source;

export type GigTableItem = {
  id: string;
  title: string;
  type: string;
  isActive: boolean;
  responses?: number | null;
  newResponses?: number | null;
  deadline?: Date | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  source: string;
  url?: string | null;
  views?: number | null;
};

interface GigsTableProps {
  gigs: GigTableItem[];
  orgSlug: string;
  workspaceSlug: string;
  sortField: string | null;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
  onDelete?: (gigId: string) => void;
}

export function GigsTable({
  gigs,
  orgSlug,
  workspaceSlug,
  sortField,
  sortDirection,
  onSort,
  onDelete,
}: GigsTableProps) {
  const SortHeader = ({
    field,
    children,
  }: {
    field: string;
    children: React.ReactNode;
  }) => (
    <TableHead>
      <button
        type="button"
        className="flex items-center gap-1 hover:underline"
        onClick={() => onSort(field)}
      >
        {children}
        {sortField === field && (
          <span className="text-muted-foreground">
            {sortDirection === "asc" ? "↑" : "↓"}
          </span>
        )}
      </button>
    </TableHead>
  );

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <SortHeader field="title">Название</SortHeader>
            <TableHead>Тип</TableHead>
            <SortHeader field="responses">Отклики</SortHeader>
            <SortHeader field="budgetMin">Бюджет</SortHeader>
            <SortHeader field="deadline">Дедлайн</SortHeader>
            <TableHead>Платформа</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {gigs.map((gig) => {
            const budget = formatBudget(gig.budgetMin, gig.budgetMax);
            const isOverdue =
              gig.deadline && gig.deadline < new Date() && gig.isActive;

            return (
              <TableRow key={gig.id}>
                <TableCell className="max-w-[200px]">
                  <Link
                    href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gig.id}`}
                    className="truncate font-medium hover:underline"
                  >
                    {gig.title}
                  </Link>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge
                      variant={gig.isActive ? "default" : "outline"}
                      className={`text-xs px-1 py-0 ${gig.isActive ? "bg-green-100 text-green-800" : ""}`}
                    >
                      {gig.isActive ? "●" : "○"}
                    </Badge>
                    {(gig.newResponses ?? 0) > 0 && (
                      <Badge className="text-xs px-1 py-0 bg-orange-100 text-orange-800">
                        +{gig.newResponses}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {getGigTypeLabel(gig.type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gig.id}/responses`}
                    className={`tabular-nums hover:underline ${
                      (gig.responses || 0) > 0
                        ? "font-medium text-blue-600"
                        : ""
                    }`}
                  >
                    {gig.responses || 0}
                  </Link>
                  {(gig.views || 0) > 0 && (
                    <span className="ml-1 text-muted-foreground text-xs">
                      (
                      {Math.round(
                        ((gig.responses || 0) / (gig.views || 1)) * 100,
                      )}
                      %)
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {budget !== "Не указан" ? budget : "—"}
                </TableCell>
                <TableCell>
                  {gig.deadline ? (
                    <span
                      className={
                        isOverdue ? "font-medium text-destructive" : ""
                      }
                    >
                      {formatListItemDate(gig.deadline)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {gig.source !== "MANUAL" && gig.source !== "WEB_LINK" ? (
                    gig.url ? (
                      <a
                        href={gig.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs hover:underline"
                      >
                        {getPlatformDisplayName(gig.source)}
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {getPlatformDisplayName(gig.source)}
                      </span>
                    )
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="size-4" />
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
                          Отклики
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gig.id}/edit`}
                        >
                          Редактировать
                        </Link>
                      </DropdownMenuItem>
                      {gig.url && (
                        <DropdownMenuItem asChild>
                          <a
                            href={gig.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
