"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";
import { ResponseKanbanCard } from "./response-kanban-card";
import { ResponseKanbanColumn } from "./response-kanban-column";

type ResponseItem =
  RouterOutputs["vacancy"]["responses"]["listWorkspace"]["responses"][0];

type ResponseStatus = "NEW" | "EVALUATED" | "INTERVIEW" | "COMPLETED" | "SKIPPED";

interface ResponsesKanbanProps {
  responses: ResponseItem[];
  isLoading: boolean;
  orgSlug: string;
  workspaceSlug: string;
}

const statusColumns = [
  { id: "NEW" as const, label: "Новые", color: "bg-blue-500" },
  { id: "EVALUATED" as const, label: "Оценённые", color: "bg-purple-500" },
  { id: "INTERVIEW" as const, label: "Собеседование", color: "bg-amber-500" },
  { id: "COMPLETED" as const, label: "Завершённые", color: "bg-green-500" },
  { id: "SKIPPED" as const, label: "Пропущенные", color: "bg-gray-500" },
];

export function ResponsesKanban({
  responses,
  isLoading,
  orgSlug,
  workspaceSlug,
}: ResponsesKanbanProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
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

  const { mutate: updateStatus } = useMutation(
    trpc.vacancy.responses.updateStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.vacancy.responses.listWorkspace.queryKey(),
        });
        toast.success("Статус отклика обновлён");
      },
      onError: (error) => {
        toast.error(error.message || "Не удалось обновить статус");
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

    const responseId = active.id as string;
    const newStatus = over.id as ResponseStatus;

    const response = responses.find((r) => r.id === responseId);
    if (!response || response.status === newStatus) return;

    updateStatus({
      responseId,
      status: newStatus,
    });
  };

  const handleCardClick = (response: ResponseItem) => {
    router.push(
      `/orgs/${orgSlug}/workspaces/${workspaceSlug}/responses/${response.id}`,
    );
  };

  const groupedResponses = statusColumns.map((column) => ({
    ...column,
    responses: responses.filter((r) => r.status === column.id),
  }));

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full overflow-x-auto">
        <section
          className="flex gap-3 md:gap-4 min-w-max h-full pb-4 items-stretch"
          aria-label="Канбан-доска откликов"
        >
          {groupedResponses.map((column) => (
            <ResponseKanbanColumn
              key={column.id}
              id={column.id}
              title={column.label}
              color={column.color}
              responses={column.responses}
              total={column.responses.length}
              onCardClick={handleCardClick}
              isLoading={isLoading}
            />
          ))}
        </section>
      </div>
      <DragOverlay>
        {(() => {
          const response = responses.find((r) => r.id === activeId);
          return activeId && response ? (
            <ResponseKanbanCard response={response} onClick={() => {}} />
          ) : null;
        })()}
      </DragOverlay>
    </DndContext>
  );
}
