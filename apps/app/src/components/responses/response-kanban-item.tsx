"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { RouterOutputs } from "@qbs-autonaim/api";
import { cn } from "@qbs-autonaim/ui";
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
      <ResponseKanbanCard
        response={response}
        onClick={() => onClick(response)}
        isDragging={isDragging}
      />
    </div>
  );
}
