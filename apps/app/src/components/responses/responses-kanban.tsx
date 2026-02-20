"use client";

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
import type { RouterOutputs } from "@qbs-autonaim/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
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
      onMutate: async ({ responseId, status }) => {
        // Отменяем исходящие запросы для предотвращения гонки данных
        await queryClient.cancelQueries({
          queryKey: trpc.vacancy.responses.listWorkspace.queryKey(),
        });

        // Сохраняем предыдущее состояние для отката
        const previousData = queryClient.getQueryData(
          trpc.vacancy.responses.listWorkspace.queryKey(),
        );

        // Оптимистично обновляем статус в кэше
        // Используем type assertion для обхода сложной типизации TanStack Query
        type QueryData = {
          responses: ResponseItem[];
          [key: string]: unknown;
        };
        queryClient.setQueryData<QueryData>(
          trpc.vacancy.responses.listWorkspace.queryKey(),
          (old): QueryData | undefined => {
            if (!old) return undefined;
            return {
              ...old,
              responses: old.responses.map((r) =>
                r.id === responseId ? { ...r, status } : r,
              ),
            };
          },
        );

        return { previousData };
      },
      onError: (error, _variables, context) => {
        // Откатываем изменения при ошибке
        if (context?.previousData) {
          queryClient.setQueryData(
            trpc.vacancy.responses.listWorkspace.queryKey(),
            context.previousData,
          );
        }
        toast.error(error.message || "Не удалось обновить статус");
      },
      onSuccess: () => {
        toast.success("Статус отклика обновлён");
      },
      onSettled: () => {
        // Синхронизируем с сервером после завершения
        queryClient.invalidateQueries({
          queryKey: trpc.vacancy.responses.listWorkspace.queryKey(),
        });
      },
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const responseId = active.id;
      if (typeof responseId !== "string") return;

      const overId = over.id;
      const isColumn =
        typeof overId === "string" &&
        VALID_STATUSES.has(overId as ResponseStatus);
      if (!isColumn) return;

      const newStatus = overId as ResponseStatus;

      const response = responses.find((r) => r.id === responseId);
      if (!response || response.status === newStatus) return;

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
    responses: responses.filter((r) => r.status === column.id),
  }));

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
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
