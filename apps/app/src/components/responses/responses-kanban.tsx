"use client";

import { Badge } from "@qbs-autonaim/ui/components/badge";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
} from "@qbs-autonaim/ui/components/reui/kanban";
import { cn } from "@qbs-autonaim/ui/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useORPC } from "~/orpc/react";
import { ResponseKanbanCard } from "./response-kanban-card";
import type { ResponseItem, ResponseStatus } from "./types";

interface ResponsesKanbanProps {
  responses: ResponseItem[];
  isLoading: boolean;
  orgSlug: string;
  workspaceSlug: string;
}

const STATUS_COLUMNS: { id: ResponseStatus; label: string; color: string }[] = [
  { id: "NEW", label: "Новые", color: "bg-blue-500" },
  { id: "EVALUATED", label: "Оценённые", color: "bg-purple-500" },
  { id: "INTERVIEW", label: "Собеседование", color: "bg-amber-500" },
  { id: "COMPLETED", label: "Завершённые", color: "bg-green-500" },
  { id: "SKIPPED", label: "Пропущенные", color: "bg-gray-500" },
];

function responsesToColumns(
  responses: ResponseItem[],
): Record<string, ResponseItem[]> {
  const columns: Record<string, ResponseItem[]> = {};
  for (const col of STATUS_COLUMNS) {
    columns[col.id] = responses.filter((r) => r.status === col.id);
  }
  return columns;
}

interface ResponseKanbanItemProps {
  response: ResponseItem;
  onCardClick: (response: ResponseItem) => void;
  asHandle: boolean;
  isOverlay: boolean;
}

function ResponseKanbanItem({
  response,
  onCardClick,
  asHandle,
  isOverlay,
}: ResponseKanbanItemProps) {
  const cardContent = (
    <ResponseKanbanCard
      response={response}
      onClick={() => onCardClick(response)}
      isDragging={isOverlay}
    />
  );

  return (
    <KanbanItem value={response.id}>
      {asHandle && !isOverlay ? (
        <KanbanItemHandle>{cardContent}</KanbanItemHandle>
      ) : (
        cardContent
      )}
    </KanbanItem>
  );
}

interface ResponseKanbanColumnProps {
  value: ResponseStatus;
  label: string;
  color: string;
  responses: ResponseItem[];
  isLoading: boolean;
  onCardClick: (response: ResponseItem) => void;
  isOverlay?: boolean;
}

function ResponseKanbanColumn({
  value,
  label,
  color,
  responses,
  isLoading,
  onCardClick,
  isOverlay = false,
}: ResponseKanbanColumnProps) {
  return (
    <KanbanColumn
      value={value}
      className="flex min-h-full w-[320px] shrink-0 flex-col"
    >
      <fieldset className="flex min-h-full flex-col border-0 p-0 m-0">
        <legend className="sr-only">{`Колонка ${label}`}</legend>
        <div className="mb-3 flex shrink-0 items-center gap-2 px-1">
          <div className={cn("w-2 h-2 rounded-full shrink-0", color)} />
          <h3 className="text-sm font-semibold truncate text-foreground/90">
            {label}
          </h3>
          <Badge variant="outline" className="ml-auto shrink-0">
            {responses.length}
          </Badge>
        </div>

        <KanbanColumnContent
          value={value}
          className={cn(
            "flex min-h-[420px] flex-1 flex-col gap-3 overflow-y-auto rounded-xl p-3 shadow-sm transition-colors",
            "border border-border/50 bg-card/90 backdrop-blur-sm",
          )}
        >
          {isLoading ? (
            <div className="space-y-3" aria-busy="true">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-32 bg-muted animate-pulse rounded-lg"
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : responses.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-12 text-muted-foreground rounded-lg border border-dashed border-border/40">
              <p className="text-sm">Нет откликов</p>
            </div>
          ) : (
            responses.map((response) => (
              <ResponseKanbanItem
                key={response.id}
                response={response}
                onCardClick={onCardClick}
                asHandle={!isOverlay}
                isOverlay={isOverlay}
              />
            ))
          )}
        </KanbanColumnContent>
      </fieldset>
    </KanbanColumn>
  );
}

export function ResponsesKanban({
  responses,
  isLoading,
  orgSlug,
  workspaceSlug,
}: ResponsesKanbanProps) {
  const router = useRouter();
  const orpc = useORPC();
  const queryClient = useQueryClient();

  const initialColumns = useMemo(
    () => responsesToColumns(responses),
    [responses],
  );
  const [columns, setColumns] = useState(initialColumns);

  // Синхронизируем с сервером при изменении responses
  useEffect(() => {
    setColumns(responsesToColumns(responses));
  }, [responses]);

  const { mutate: updateStatus } = useMutation(
    orpc.vacancy.responses.updateStatus.mutationOptions({
      onError: () => {
        setColumns(responsesToColumns(responses));
        toast.error("Не удалось обновить статус");
      },
      onSuccess: () => {
        toast.success("Статус отклика обновлён");
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.vacancy.responses.listWorkspace.queryKey(),
        });
      },
    }),
  );

  const handleCardClick = useCallback(
    (response: ResponseItem) => {
      router.push(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/responses/${response.id}`,
      );
    },
    [router, orgSlug, workspaceSlug],
  );

  const handleMove = useCallback(
    (event: {
      activeContainer: string;
      activeIndex: number;
      overContainer: string;
    }) => {
      const { activeContainer, activeIndex, overContainer } = event;
      const item = columns[activeContainer]?.[activeIndex];
      if (!item || activeContainer === overContainer) return;

      const newStatus = overContainer as ResponseStatus;

      setColumns((prev) => {
        const next = { ...prev };
        const activeItems = [...(prev[activeContainer] ?? [])];
        const [movedItem] = activeItems.splice(activeIndex, 1);
        if (!movedItem) return prev;
        next[activeContainer] = activeItems;
        const updatedItem: ResponseItem = { ...item, status: newStatus };
        next[overContainer] = [...(prev[overContainer] ?? []), updatedItem];
        return next;
      });

      updateStatus({
        responseId: item.id,
        status: newStatus,
      });
    },
    [columns, updateStatus],
  );

  return (
    <Kanban<ResponseItem>
      value={columns}
      onValueChange={setColumns}
      getItemValue={(item) => item.id}
      onMove={handleMove}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-x-auto rounded-2xl bg-muted/40 p-4">
        <KanbanBoard
          className="flex min-h-full min-w-max flex-1 gap-3 pb-2 md:gap-4 items-stretch"
          aria-label="Канбан-доска откликов"
        >
          {STATUS_COLUMNS.map((col) => (
            <ResponseKanbanColumn
              key={col.id}
              value={col.id}
              label={col.label}
              color={col.color}
              responses={columns[col.id] ?? []}
              isLoading={isLoading}
              onCardClick={handleCardClick}
            />
          ))}
        </KanbanBoard>
      </div>
      <KanbanOverlay className="rounded-lg">
        {({ value }) => {
          const response = Object.values(columns)
            .flat()
            .find((r) => r.id === value);
          return response ? (
            <ResponseKanbanCard
              response={response}
              onClick={() => {}}
              isDragging
            />
          ) : null;
        }}
      </KanbanOverlay>
    </Kanban>
  );
}
