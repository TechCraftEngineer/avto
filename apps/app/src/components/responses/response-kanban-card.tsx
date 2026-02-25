"use client";

import { CandidateAvatar } from "@qbs-autonaim/ui/components/candidate-avatar";
import { Badge } from "@qbs-autonaim/ui/components/reui/badge";
import { cn } from "@qbs-autonaim/ui/utils";
import { IconClock, IconMessageCircle, IconStar } from "@tabler/icons-react";
import { useAvatarUrl } from "~/hooks/use-avatar-url";
import { getAvatarUrl } from "~/lib/avatar";
import type { ResponseItem } from "./types";

interface ResponseKanbanCardProps {
  response: ResponseItem;
  onClick: () => void;
  isDragging?: boolean;
}

export function ResponseKanbanCard({
  response,
  onClick,
  isDragging = false,
}: ResponseKanbanCardProps) {
  const score = response.screening?.score;
  const hasInterview = response.interviewSession !== null;
  const messageCount = response.interviewSession?.messageCount ?? 0;
  const photoUrl = useAvatarUrl(response.photoFileId);
  const avatarUrl = getAvatarUrl(photoUrl, response.candidateName ?? "");

  // Определяем цвет границы по рейтингу (шкала 0-100)
  const getBorderColor = () => {
    if (score === null || score === undefined) return "border-border";
    if (score >= 80) return "border-l-green-500 border-l-4";
    if (score >= 60) return "border-l-emerald-500 border-l-4";
    if (score >= 40) return "border-l-yellow-500 border-l-4";
    if (score >= 20) return "border-l-orange-500 border-l-4";
    return "border-l-red-500 border-l-4";
  };

  return (
    <div
      className={cn(
        "w-full min-w-0 bg-card border border-border rounded-xl flex flex-col group relative shadow-sm ring-1 ring-foreground/5",
        getBorderColor(),
        // Отключаем transition при перетаскивании для предотвращения конфликта с dnd-kit
        isDragging
          ? "transition-none shadow-lg scale-105"
          : "transition-shadow duration-200 hover:shadow-md hover:border-primary/30",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          {response.priorityScore !== null && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
              <span className="font-medium">Приоритет:</span>
              <Badge variant="outline" size="sm">
                {response.priorityScore.toFixed(1)}
              </Badge>
            </div>
          )}
          {messageCount > 0 && (
            <div
              className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0"
              title={`${messageCount} сообщений в переписке`}
            >
              <IconMessageCircle className="size-3.5" />
              <span className="font-medium tabular-nums">{messageCount}</span>
            </div>
          )}
        </div>
        {score !== null && score !== undefined && (
          <Badge
            variant={score >= 60 ? "success" : "secondary"}
            size="sm"
            className="shrink-0"
          >
            <IconStar className="size-3 mr-1" />
            {score.toFixed(0)}
          </Badge>
        )}
      </div>

      <button
        onClick={onClick}
        className="flex-1 p-3 cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-b-xl"
        type="button"
      >
        <div className="flex gap-3">
          <CandidateAvatar
            name={response.candidateName}
            photoUrl={avatarUrl}
            photoFileId={response.photoFileId}
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
              <Badge variant="info-light" size="sm" className="w-fit">
                Есть интервью
              </Badge>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}
