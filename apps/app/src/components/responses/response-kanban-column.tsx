"use client";

import { useDroppable } from "@dnd-kit/core";
import type { RouterOutputs } from "@qbs-autonaim/api";
import { cn } from "@qbs-autonaim/ui";
import { IconUser } from "@tabler/icons-react";
import { ResponseKanbanItem } from "./response-kanban-item";

type ResponseItem =
  RouterOutputs["vacancy"]["responses"]["listWorkspace"]["responses"][0];

interface ResponseKanbanColumnProps {
  id: string;
  title: string;
  color: string;
  responses: ResponseItem[];
  total: number;
  onCardClick: (response: ResponseItem) => void;
  isLoading?: boolean;
}

export function ResponseKanbanColumn({
  id,
  title,
  color,
  responses,
  total,
  onCardClick,
  isLoading,
}: ResponseKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <fieldset className="flex flex-col w-[320px] shrink-0 border-0 p-0 m-0 h-full">
      <legend className="sr-only">{`Колонка ${title}`}</legend>
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={cn("w-2 h-2 rounded-full shrink-0", color)} />
        <h3 className="text-sm font-semibold truncate text-foreground/90">{title}</h3>
        <span className="text-xs font-medium text-muted-foreground bg-background/80 px-2.5 py-0.5 rounded-full tabular-nums ml-auto shrink-0">
          {total}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-col gap-3 flex-1 p-3 rounded-xl transition-colors overflow-y-auto min-h-70 shadow-sm",
          isOver
            ? "border-2 border-primary/50 bg-primary/5 ring-2 ring-primary/20"
            : "border border-border/50 bg-card/90 backdrop-blur-sm",
        )}
      >
        {isLoading ? (
          <div className="space-y-3" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-muted animate-pulse rounded-lg"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : responses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground flex-1 rounded-lg border border-dashed border-border/40">
            <IconUser className="h-8 w-8 mb-2 opacity-40" aria-hidden="true" />
            <p className="text-sm">Нет откликов</p>
          </div>
        ) : (
          responses.map((response) => (
            <ResponseKanbanItem
              key={response.id}
              response={response}
              onClick={onCardClick}
            />
          ))
        )}
      </div>
    </fieldset>
  );
}
