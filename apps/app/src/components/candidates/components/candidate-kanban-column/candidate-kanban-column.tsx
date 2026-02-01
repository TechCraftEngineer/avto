"use client";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@qbs-autonaim/ui";
import { Users } from "lucide-react";
import { CandidateKanbanItem } from "./candidate-kanban-item";
import type { FunnelCandidate } from "./types";

interface CandidateKanbanColumnProps {
  id: string;
  title: string;
  color: string;
  candidates: FunnelCandidate[];
  total: number;
  hasMore: boolean;
  onCardClick: (candidate: FunnelCandidate) => void;
  onLoadMore: () => void;
  isLoading?: boolean;
  isLoadingMore?: boolean;
}

export function CandidateKanbanColumn({
  id,
  title,
  color,
  candidates,
  total,
  hasMore,
  onCardClick,
  onLoadMore,
  isLoading,
  isLoadingMore,
}: CandidateKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <fieldset className="flex flex-col w-[320px] shrink-0 border-0 p-0 m-0 h-full">
      <legend className="sr-only">{`Колонка ${title}`}</legend>
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={cn("w-2 h-2 rounded-full shrink-0", color)} />
        <h3 className="text-sm font-semibold truncate">{title}</h3>
        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full tabular-nums ml-auto shrink-0">
          {total}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-col gap-3 flex-1 p-3 rounded-xl border-2 border-dashed transition-colors overflow-y-auto",
          isOver
            ? "border-primary/50 bg-primary/5"
            : "border-transparent bg-muted/30",
        )}
      >
        {isLoading ? (
          <div className="space-y-3" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 bg-muted animate-pulse rounded-lg"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground flex-1">
            <Users className="h-8 w-8 mb-2 opacity-40" aria-hidden="true" />
            <p className="text-sm">Нет кандидатов</p>
          </div>
        ) : (
          <>
            {candidates.map((candidate) => (
              <CandidateKanbanItem
                key={candidate.id}
                candidate={candidate}
                onClick={onCardClick}
              />
            ))}
            {isLoadingMore && (
              <div className="space-y-3" aria-busy="true">
                {[1, 2].map((i) => (
                  <div
                    key={`loading-${i}`}
                    className="h-40 bg-muted animate-pulse rounded-lg"
                    aria-hidden="true"
                  />
                ))}
              </div>
            )}
            {hasMore && !isLoadingMore && (
              <button
                onClick={onLoadMore}
                className="w-full py-2.5 px-3 text-sm font-medium text-muted-foreground hover:text-foreground bg-background hover:bg-muted border border-dashed rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                type="button"
                aria-label={`Загрузить ещё кандидатов для ${title}`}
              >
                Загрузить ещё ({total - candidates.length})
              </button>
            )}
          </>
        )}
      </div>
    </fieldset>
  );
}
