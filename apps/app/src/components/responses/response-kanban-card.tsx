"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import { Badge } from "@qbs-autonaim/ui/badge";
import { CandidateAvatar } from "@qbs-autonaim/ui/candidate-avatar";
import { IconClock, IconStar } from "@tabler/icons-react";

type ResponseItem =
  RouterOutputs["vacancy"]["responses"]["listWorkspace"]["responses"][0];

interface ResponseKanbanCardProps {
  response: ResponseItem;
  onClick: () => void;
}

export function ResponseKanbanCard({
  response,
  onClick,
}: ResponseKanbanCardProps) {
  const score = response.screening?.score;
  const hasInterview = response.interviewSession !== null;

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30 flex flex-col group relative">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b">
        {response.priorityScore !== null && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-medium">Приоритет:</span>
            <Badge variant="outline" className="text-xs">
              {response.priorityScore.toFixed(1)}
            </Badge>
          </div>
        )}
        {response.priorityScore === null && <div />}
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

      <button
        onClick={onClick}
        className="flex-1 p-3 cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-b-lg"
        type="button"
      >
        <div className="flex gap-3">
          <CandidateAvatar
            name={response.candidateName}
            photoUrl={null}
            photoFileId={null}
            className="size-10 shrink-0"
          />
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <h4 className="font-semibold text-sm leading-tight truncate">
              {response.candidateName || "Без имени"}
            </h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <IconClock className="size-3 shrink-0" />
              <span className="truncate">
                {response.respondedAt
                  ? new Date(response.respondedAt).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                    })
                  : "Нет даты"}
              </span>
            </div>
            {hasInterview && (
              <Badge variant="default" className="text-xs w-fit">
                Есть интервью
              </Badge>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}
