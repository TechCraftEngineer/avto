import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useState } from "react";
import { CandidateKanbanCard } from "./candidate-kanban-card";
import { CandidateKanbanColumn } from "./candidate-kanban-column";
import { STAGES } from "./constants";
import type { FunnelCandidate, FunnelStage } from "./types";

interface PipelineBoardViewProps {
  candidatesByStage: Record<
    FunnelStage,
    { items: FunnelCandidate[]; hasMore: boolean; total: number }
  >;
  allCandidates: FunnelCandidate[];
  onCardClick: (candidate: FunnelCandidate) => void;
  onLoadMore: (stage: FunnelStage) => void;
  onDragEnd: (candidateId: string, newStage: FunnelStage) => void;
  stageQueries: Array<{
    stage: FunnelStage;
    query: { isLoading: boolean; isFetching: boolean };
  }>;
}

export function PipelineBoardView({
  candidatesByStage,
  allCandidates,
  onCardClick,
  onLoadMore,
  onDragEnd,
  stageQueries,
}: PipelineBoardViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const candidateId = active.id as string;
    const newStage = over.id as FunnelStage;

    let candidate: FunnelCandidate | undefined;
    for (const stage of Object.keys(candidatesByStage) as FunnelStage[]) {
      candidate = candidatesByStage[stage].items.find(
        (c) => c.id === candidateId,
      );
      if (candidate) break;
    }

    if (!candidate || candidate.stage === newStage) return;

    onDragEnd(candidateId, newStage);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full overflow-x-auto px-4 md:px-6 lg:px-8">
        <section
          className="flex gap-3 md:gap-4 min-w-max h-full pb-4 items-stretch"
          aria-label="Канбан-доска кандидатов"
        >
          {STAGES.map((stage) => {
            const stageData = candidatesByStage[stage.id];
            const stageQuery = stageQueries.find((sq) => sq.stage === stage.id);
            return (
              <CandidateKanbanColumn
                key={stage.id}
                id={stage.id}
                title={stage.title}
                color={stage.color}
                candidates={stageData.items}
                total={stageData.total}
                hasMore={stageData.hasMore}
                onCardClick={onCardClick}
                onLoadMore={() => onLoadMore(stage.id)}
                isLoading={stageQuery?.query.isLoading ?? false}
                isLoadingMore={stageQuery?.query.isFetching ?? false}
              />
            );
          })}
        </section>
      </div>
      <DragOverlay>
        {(() => {
          const candidate = allCandidates.find((c) => c.id === activeId);
          return activeId && candidate ? (
            <CandidateKanbanCard candidate={candidate} onClick={() => {}} />
          ) : null;
        })()}
      </DragOverlay>
    </DndContext>
  );
}
