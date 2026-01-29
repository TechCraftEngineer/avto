"use client";

import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  TableCell,
  TableRow,
} from "@qbs-autonaim/ui";
import {
  IconChevronRight,
  IconMessageCircle,
  IconSparkles,
  IconStar,
} from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";

interface Response {
  id: string;
  candidateName: string | null;
  status: string;
  hrSelectionStatus: string | null;
  respondedAt: Date | null;
  createdAt: Date;
  screening: {
    score: number;
    detailedScore: number;
  } | null;
  interviewScoring: {
    score: number;
    detailedScore: number;
  } | null;
  priorityScore: number;
}

interface ResponsesTableRowProps {
  response: Response;
  orgSlug: string;
  workspaceSlug: string;
}

export function ResponsesTableRow({
  response,
  orgSlug,
  workspaceSlug,
}: ResponsesTableRowProps) {
  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "outline" | "destructive";
      }
    > = {
      NEW: { label: "Новый", variant: "default" },
      EVALUATED: { label: "Оценён", variant: "secondary" },
      INTERVIEW: { label: "Интервью", variant: "outline" },
      COMPLETED: { label: "Завершён", variant: "secondary" },
      SKIPPED: { label: "Пропущен", variant: "outline" },
    };

    const config = statusMap[status] ?? {
      label: status,
      variant: "outline" as const,
    };
    return (
      <Badge variant={config.variant} className="font-medium">
        {config.label}
      </Badge>
    );
  };

  const getScoreBadge = (score: number) => {
    if (score >= 4) {
      return (
        <Badge className="gap-1 bg-green-500/10 text-green-700 hover:bg-green-500/20">
          <IconStar className="size-3" />
          {score.toFixed(1)}
        </Badge>
      );
    }
    if (score >= 3) {
      return (
        <Badge className="gap-1 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20">
          <IconSparkles className="size-3" />
          {score.toFixed(1)}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        {score.toFixed(1)}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: number) => {
    if (priority >= 70) {
      return (
        <Badge className="bg-red-500/10 text-red-700 hover:bg-red-500/20">
          Высокий
        </Badge>
      );
    }
    if (priority >= 40) {
      return (
        <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20">
          Средний
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Низкий
      </Badge>
    );
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ru,
    });
  };

  return (
    <TableRow className="group hover:bg-muted/50">
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
              {getInitials(response.candidateName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">
              {response.candidateName || "Без имени"}
            </span>
            {response.interviewScoring && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <IconMessageCircle className="size-3" />
                Прошёл интервью
              </span>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell>
        {response.screening ? (
          <div className="flex flex-col gap-1">
            {getScoreBadge(response.screening.score)}
            <span className="text-xs text-muted-foreground">
              {response.screening.detailedScore}/100
            </span>
          </div>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Не оценён
          </Badge>
        )}
      </TableCell>

      <TableCell>{getPriorityBadge(response.priorityScore)}</TableCell>

      <TableCell>{getStatusBadge(response.status)}</TableCell>

      <TableCell>
        <span className="text-sm text-muted-foreground">
          {formatDate(response.respondedAt)}
        </span>
      </TableCell>

      <TableCell className="text-right">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-1 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Link
            href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/responses/${response.id}`}
          >
            Открыть
            <IconChevronRight className="size-4" />
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}
