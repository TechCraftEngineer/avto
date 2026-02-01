"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CandidateKanbanCard } from "./candidate-kanban-card";
import type { FunnelCandidate } from "./types";

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

  if (isDragging) {
    return (
      <div ref={setNodeRef} style={style} className="opacity-40 grayscale">
        <CandidateKanbanCard candidate={candidate} onClick={() => {}} />
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <CandidateKanbanCard
        candidate={candidate}
        onClick={() => onClick(candidate)}
      />
    </div>
  );
}
