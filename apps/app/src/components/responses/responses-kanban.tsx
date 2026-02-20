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
import type { RouterOutputs } from "@qbs-autonaim/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";
import { ResponseKanbanCard } from "./response-kanban-card";
import { ResponseKanbanColumn } from "./response-kanban-column";

type ResponseItem =
  RouterOutputs["vacancy"]["responses"]["listWorkspace"]["responses"][0];

type ResponseStatus =
  | "NEW"
  | "EVALUATED"
  | "INTERVIEW"
  | "COMPLETED"
  | "SKIPPED";

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

const VALID_STATUSES = new Set(statusColumns.map((c) => c.id));

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
  const [localResponses, setLocalResponses] = useState(responses);
  const [isDragging, setIsDragging] = useState(false);

  // Синхронизируем только когда не перетаскиваем
  useMemo(() => {
    if (!isDragging) {
      setLocalResponses(responses);
    }
  }, [responses, isDragging]);

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

  const { mutate: updateStatus } = useMutation(
    trpc.vacancy.responses.updateStatus.mutationOptions({
      onError: (error) => {
        setLocalResponses(responses);
        toast.error(error.message || "Не удалось обновить статус");
      },
      onSuccess: () => {
        toast.success("Статус отклика обновлён");
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.vacancy.responses.listWorkspace.queryKey(),
        });
      },
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setIsDragging(true);
    document.body.style.userSelect = "none";
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;

      if (!over) return;

      const responseId = active.id;
      if (typeof responseId !== "string") return;

      const overId = over.id;
      const isColumn =
        typeof overId === "string" &&
        VALID_STATUSES.has(overId as ResponseStatus);
      if (!isColumn) return;

      const newStatus = overId as ResponseStatus;

      const response = localResponses.find((r) => r.id === responseId);
      if (!response || response.status === newStatus) return;

      setLocalResponses((prev) =>
        prev.map((r) => (r.id === responseId ? { ...r, status: newStatus } : r)),
      );
    },
    [localResponses],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      document.body.style.userSelect = "";
      setActiveId(null);
      setIsDragging(false);

      if (!over) {
        setLocalResponses(responses);
        return;
      }

      const responseId = active.id;
      if (typeof responseId !== "string") {
        setLocalResponses(responses);
        return;
      }

      const overId = over.id;
      const isColumn =
        typeof overId === "string" &&
        VALID_STATUSES.has(overId as ResponseStatus);
      if (!isColumn) {
        setLocalResponses(responses);
        return;
      }

      const newStatus = overId as ResponseStatus;

      const response = responses.find((r) => r.id === responseId);
      if (!response || response.status === newStatus) {
        setLocalResponses(responses);
        return;
      }

      updateStatus({
        responseId,
        status: newStatus,
      });
    },
    [responses, updateStatus],
  );

  const handleCardClick = useCallback(
    (response: ResponseItem) => {
      router.push(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/responses/${response.id}`,
      );
    },
    [router, orgSlug, workspaceSlug],
  );

  const groupedResponses = statusColumns.map((column) => ({
    ...column,
    responses: localResponses.filter((r) => r.status === column.id),
  }));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-x-auto rounded-2xl bg-muted/40 p-4">
        <section
          className="flex min-h-full min-w-max flex-1 gap-3 pb-2 md:gap-4 items-stretch"
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
            <ResponseKanbanCard
              response={response}
              onClick={() => {}}
              isDragging
            />
          ) : null;
        })()}
      </DragOverlay>
    </DndContext>
  );
}
