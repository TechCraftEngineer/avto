"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { RouterOutputs } from "@qbs-autonaim/api";
import { ResponseKanbanCard } from "./response-kanban-card";

type ResponseItem =
  RouterOutputs["vacancy"]["responses"]["listWorkspace"]["responses"][0];

interface ResponseKanbanItemProps {
  response: ResponseItem;
  onClick: (response: ResponseItem) => void;
}

export function ResponseKanbanItem({
  response,
  onClick,
}: ResponseKanbanItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: response.id,
      data: { response },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  if (isDragging) {
    return (
      <div ref={setNodeRef} style={style} className="opacity-40 grayscale">
        <ResponseKanbanCard response={response} onClick={() => {}} />
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <ResponseKanbanCard
        response={response}
        onClick={() => onClick(response)}
      />
    </div>
  );
}
