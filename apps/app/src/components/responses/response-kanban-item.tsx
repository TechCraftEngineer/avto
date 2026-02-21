"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@qbs-autonaim/ui";
import { ResponseKanbanCard } from "./response-kanban-card";
import type { ResponseItem } from "./types";

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
    touchAction: "none",
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
        "will-change-transform", // Оптимизация для GPU
        isDragging &&
          "opacity-30 grayscale pointer-events-none cursor-grabbing",
        !isDragging && "cursor-grab active:cursor-grabbing",
      )}
    >
      <ResponseKanbanCard
        response={response}
        onClick={() => onClick(response)}
        isDragging={isDragging}
      />
    </div>
  );
}
