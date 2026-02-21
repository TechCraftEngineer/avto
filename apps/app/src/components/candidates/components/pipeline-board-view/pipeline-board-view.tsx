"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useCallback, useState } from "react";
import { CandidateKanbanCard } from "../candidate-kanban-card";
import { CandidateKanbanColumn } from "../candidate-kanban-column";
import { STAGES } from "../constants";
import type { FunnelCandidate, FunnelStage } from "../types";

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
  const [localCandidatesByStage, setLocalCandidatesByStage] =
    useState(candidatesByStage);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    document.body.style.userSelect = "none";
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;

      if (!over) return;

      const candidateId = active.id as string;
      const newStage = over.id as FunnelStage;

      // Находим кандидата и его текущую стадию
      let candidate: FunnelCandidate | undefined;
      let currentStage: FunnelStage | undefined;

      for (const stage of Object.keys(
        localCandidatesByStage,
      ) as FunnelStage[]) {
        candidate = localCandidatesByStage[stage].items.find(
          (c) => c.id === candidateId,
        );
        if (candidate) {
          currentStage = stage;
          break;
        }
      }

      if (!candidate || !currentStage || currentStage === newStage) return;

      // Оптимистично обновляем локальное состояние
      setLocalCandidatesByStage((prev) => {
        const updated = { ...prev };

        // Удаляем из старой стадии
        updated[currentStage] = {
          ...updated[currentStage],
          items: updated[currentStage].items.filter(
            (c) => c.id !== candidateId,
          ),
          total: Math.max(0, updated[currentStage].total - 1),
        };

        // Добавляем в новую стадию
        const updatedCandidate = { ...candidate, stage: newStage };
        updated[newStage] = {
          ...updated[newStage],
          items: [updatedCandidate, ...updated[newStage].items],
          total: updated[newStage].total + 1,
        };

        return updated;
      });
    },
    [localCandidatesByStage],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      document.body.style.userSelect = "";
      setActiveId(null);

      const { active, over } = event;

      if (!over) {
        // Откатываем изменения если не над зоной сброса
        setLocalCandidatesByStage(candidatesByStage);
        return;
      }

      const candidateId = active.id as string;
      const newStage = over.id as FunnelStage;

      // Находим оригинального кандидата
      let candidate: FunnelCandidate | undefined;
      for (const stage of Object.keys(candidatesByStage) as FunnelStage[]) {
        candidate = candidatesByStage[stage].items.find(
          (c) => c.id === candidateId,
        );
        if (candidate) break;
      }

      if (!candidate || candidate.stage === newStage) {
        setLocalCandidatesByStage(candidatesByStage);
        return;
      }

      // Вызываем обработчик для сохранения на сервере
      onDragEnd(candidateId, newStage);
    },
    [candidatesByStage, onDragEnd],
  );

  // Синхронизируем локальное состояние с пропсами
  if (candidatesByStage !== localCandidatesByStage && !activeId) {
    setLocalCandidatesByStage(candidatesByStage);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full overflow-x-auto px-4 md:px-6 lg:px-8">
        <section
          className="flex gap-3 md:gap-4 min-w-max h-full pb-4 items-stretch"
          aria-label="Канбан-доска кандидатов"
        >
          {STAGES.map((stage) => {
            const stageData = localCandidatesByStage[stage.id];
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
            <CandidateKanbanCard
              candidate={candidate}
              onClick={() => {}}
              isDragging
            />
          ) : null;
        })()}
      </DragOverlay>
    </DndContext>
  );
}
