"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@qbs-autonaim/ui";
import { CandidateKanbanCard } from "~/components";
import type { FunnelCandidate } from "../../types/types";

interface CandidateKanbanItemProps {
  candidate: FunnelCandidate;
  onClick: (candidate: FunnelCandidate) => void;
}

export function CandidateKanbanItem({
  candidate,
  onClick,
}: CandidateKanbanItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: candidate.id,
      data: { candidate },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  // Всегда применяем transform и рендерим одну структуру
  // При перетаскивании показываем заглушку (opacity + pointer-events none)
  // DragOverlay показывает реальную перетаскиваемую карточку
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "transition-none", // Отключаем transition для предотвращения конфликта с dnd-kit
        isDragging && "opacity-30 grayscale pointer-events-none",
      )}
    >
      <CandidateKanbanCard
        candidate={candidate}
        onClick={() => onClick(candidate)}
        isDragging={isDragging}
      />
    </div>
  );
}
