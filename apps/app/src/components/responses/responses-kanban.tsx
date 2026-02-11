"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import { Badge } from "@qbs-autonaim/ui/badge";
import { Card, CardContent, CardHeader } from "@qbs-autonaim/ui/card";
import { Skeleton } from "@qbs-autonaim/ui/skeleton";
import { IconClock, IconStar, IconUser } from "@tabler/icons-react";
import Link from "next/link";

type ResponseItem =
  RouterOutputs["vacancy"]["responses"]["listAllWorkspace"]["responses"][0];

interface ResponsesKanbanProps {
  responses: ResponseItem[];
  isLoading: boolean;
  orgSlug: string;
  workspaceSlug: string;
}

const statusColumns = [
  { id: "NEW", label: "Новые", color: "bg-blue-500/10 border-blue-500/20" },
  {
    id: "EVALUATED",
    label: "Оценённые",
    color: "bg-purple-500/10 border-purple-500/20",
  },
  {
    id: "INTERVIEW",
    label: "Собеседование",
    color: "bg-amber-500/10 border-amber-500/20",
  },
  {
    id: "COMPLETED",
    label: "Завершённые",
    color: "bg-green-500/10 border-green-500/20",
  },
  {
    id: "SKIPPED",
    label: "Пропущенные",
    color: "bg-gray-500/10 border-gray-500/20",
  },
];

function ResponseCard({
  response,
  orgSlug,
  workspaceSlug,
}: {
  response: ResponseItem;
  orgSlug: string;
  workspaceSlug: string;
}) {
  const score = response.screening?.score;
  const hasInterview = response.interviewSession !== null;

  return (
    <Link
      href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/responses/${response.id}`}
      className="block"
    >
      <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
        <CardHeader className="p-4 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                {response.candidateName || "Без имени"}
              </h4>
            </div>
            {score !== null && score !== undefined && (
              <Badge
                variant={score >= 4 ? "default" : "secondary"}
                className="shrink-0"
              >
                <IconStar className="size-3 mr-1" />
                {score.toFixed(1)}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-2">
          {response.priorityScore !== null && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Приоритет:</span>
              <Badge variant="outline" className="text-xs">
                {response.priorityScore.toFixed(1)}
              </Badge>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <IconClock className="size-3" />
            {response.respondedAt
              ? new Date(response.respondedAt).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "short",
                })
              : "Нет даты"}
          </div>
          {hasInterview && (
            <Badge variant="default" className="text-xs">
              Есть интервью
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function KanbanColumn({
  column,
  responses,
  orgSlug,
  workspaceSlug,
  isLoading,
}: {
  column: (typeof statusColumns)[0];
  responses: ResponseItem[];
  orgSlug: string;
  workspaceSlug: string;
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] flex-1">
      <div className={`rounded-t-lg border-t border-x p-3 ${column.color}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{column.label}</h3>
          <Badge variant="secondary" className="text-xs">
            {responses.length}
          </Badge>
        </div>
      </div>
      <div className="flex-1 border-x border-b rounded-b-lg bg-muted/30 overflow-hidden">
        <div className="h-[600px] overflow-y-auto">
          <div className="p-3 space-y-3 min-h-[400px]">
            {isLoading ? (
              <>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </>
            ) : responses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <IconUser className="size-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">Нет откликов</p>
              </div>
            ) : (
              responses.map((response) => (
                <ResponseCard
                  key={response.id}
                  response={response}
                  orgSlug={orgSlug}
                  workspaceSlug={workspaceSlug}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ResponsesKanban({
  responses,
  isLoading,
  orgSlug,
  workspaceSlug,
}: ResponsesKanbanProps) {
  const groupedResponses = statusColumns.map((column) => ({
    ...column,
    responses: responses.filter((r) => r.status === column.id),
  }));

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {groupedResponses.map((column) => (
        <KanbanColumn
          key={column.id}
          column={column}
          responses={column.responses}
          orgSlug={orgSlug}
          workspaceSlug={workspaceSlug}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
