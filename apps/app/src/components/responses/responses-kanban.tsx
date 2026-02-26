"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import { Badge } from "@qbs-autonaim/ui/components/reui/badge";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanColumnHandle,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
} from "@qbs-autonaim/ui/components/reui/kanban";
import { cn } from "@qbs-autonaim/ui/utils";
import { IconGripVertical } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useORPC } from "~/orpc/react";
import { ResponseKanbanCard } from "./response-kanban-card";
import type { ResponseItem, ResponseStatus } from "./types";

interface VacancyOption {
  id: string;
  title: string;
}

interface ResponsesKanbanProps {
  responses: ResponseItem[];
  isLoading: boolean;
  orgSlug: string;
  workspaceSlug: string;
  workspaceId: string;
  vacancies?: VacancyOption[];
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
  vacancyTitle?: string;
}

function ResponseKanbanItem({
  response,
  onCardClick,
  asHandle,
  isOverlay,
  vacancyTitle,
}: ResponseKanbanItemProps) {
  const cardContent = (
    <ResponseKanbanCard
      response={response}
      onClick={() => onCardClick(response)}
      isDragging={isOverlay}
      vacancyTitle={vacancyTitle}
    />
  );

  return (
    <KanbanItem value={response.id} className="w-full min-w-0">
      {asHandle && !isOverlay ? (
        <KanbanItemHandle className="w-full min-w-0">
          {cardContent}
        </KanbanItemHandle>
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
  vacancyMap?: Map<string, string>;
}

function ResponseKanbanColumn({
  value,
  label,
  color,
  responses,
  isLoading,
  onCardClick,
  isOverlay = false,
  vacancyMap,
}: ResponseKanbanColumnProps) {
  return (
    <KanbanColumn
      value={value}
      className="flex min-h-full w-[360px] shrink-0 flex-col"
    >
      <fieldset className="flex min-h-full flex-col border-0 p-0 m-0">
        <legend className="sr-only">{`Колонка ${label}`}</legend>
        <div className="mb-3 flex shrink-0 items-center gap-2 px-1">
          {!isOverlay && (
            <KanbanColumnHandle
              render={(props) => (
                <Button {...props} size="icon-xs" variant="ghost">
                  <IconGripVertical className="size-3.5" />
                </Button>
              )}
            />
          )}
          <div className={cn("w-2 h-2 rounded-full shrink-0", color)} />
          <h3 className="text-sm font-semibold truncate text-foreground/90">
            {label}
          </h3>
          <Badge variant="secondary" size="sm" className="ml-auto shrink-0">
            {responses.length}
          </Badge>
        </div>

        <KanbanColumnContent
          value={value}
          className={cn(
            "flex min-h-[420px] min-w-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden rounded-lg p-3 transition-colors",
            "border border-border/60 bg-muted/20",
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
            <div className="flex flex-1 flex-col items-center justify-center py-12 text-muted-foreground rounded-lg border border-dashed border-border/60 bg-background/50">
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
                vacancyTitle={vacancyMap?.get(response.entityId)}
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
  workspaceId,
  vacancies = [],
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
          queryKey: orpc.vacancy.responses.listWorkspace.queryKey({
            input: {
              workspaceId,
              page: 1,
              limit: 50,
              sortField: null,
              sortDirection: "desc",
              screeningFilter: "all",
            },
          }),
        });
      },
    }),
  );

  const vacancyMap = useMemo(
    () => new Map(vacancies.map((v) => [v.id, v.title])),
    [vacancies],
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
      event: { active: { id: unknown } };
      activeContainer: string;
      activeIndex: number;
      overContainer: string;
    }) => {
      const { activeContainer, overContainer, event: dndEvent } = event;
      const activeId = String(dndEvent.active.id);
      // После оптимистичного обновления элемент уже в overContainer
      const item =
        columns[overContainer]?.find((r) => r.id === activeId) ??
        columns[activeContainer]?.[event.activeIndex];
      if (!item || activeContainer === overContainer) return;

      const newStatus = overContainer as ResponseStatus;

      // UI уже обновлён оптимистично в handleDragOver, остаётся только синхронизация с API
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
      <div className="flex min-h-0 flex-1 flex-col overflow-x-auto rounded-lg">
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
              vacancyMap={vacancyMap}
            />
          ))}
        </KanbanBoard>
      </div>
      <KanbanOverlay className="bg-muted/10 rounded-lg border-2 border-dashed border-border">
        <div className="h-24 min-w-[200px]" aria-hidden />
      </KanbanOverlay>
    </Kanban>
  );
}
