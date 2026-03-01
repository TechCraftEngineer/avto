"use client";

import { paths } from "@qbs-autonaim/config";
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
import {
  IconChevronLeft,
  IconChevronRight,
  IconGripVertical,
  IconSettings,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useORPC } from "~/orpc/react";
import { ResponseKanbanCard } from "./response-kanban-card";
import type { ResponseItem } from "./types";

/** Legacy ключи для маппинга status/hrSelectionStatus → stage */
type LegacyStageKey =
  | "SCREENING_DONE"
  | "INTERVIEW"
  | "OFFER_SENT"
  | "SECURITY_PASSED"
  | "CONTRACT_SENT"
  | "ONBOARDING"
  | "REJECTED";

/**
 * Маппинг status + hrSelectionStatus → legacy_key (для fallback при отсутствии pipeline_stage_id)
 */
function mapResponseToLegacyStage(
  status: string,
  hrSelectionStatus: string | null,
): LegacyStageKey {
  if (hrSelectionStatus === "ONBOARDING") return "ONBOARDING";
  if (hrSelectionStatus === "CONTRACT_SENT") return "CONTRACT_SENT";
  if (hrSelectionStatus === "SECURITY_PASSED") return "SECURITY_PASSED";
  if (hrSelectionStatus === "OFFER") return "OFFER_SENT";
  if (hrSelectionStatus === "INVITE" || hrSelectionStatus === "RECOMMENDED")
    return "OFFER_SENT";
  if (
    hrSelectionStatus === "REJECTED" ||
    hrSelectionStatus === "NOT_RECOMMENDED" ||
    status === "SKIPPED"
  )
    return "REJECTED";
  if (status === "EVALUATED") return "SCREENING_DONE";
  return "INTERVIEW";
}

type PipelineStage = {
  id: string;
  label: string;
  position: number;
  color: string | null;
  legacyKey: string | null;
};

const EMPTY_STAGES: PipelineStage[] = [];

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
  /** Для per-vacancy pipeline (пока не используется) */
  entityId?: string;
  /** Ключ сортировки/фильтров: при его смене используется порядок с сервера */
  sortKey?: string;
}

function responsesToColumns(
  responses: ResponseItem[],
  stages: PipelineStage[],
): Record<string, ResponseItem[]> {
  if (stages.length === 0) return {};
  const stageIds = new Set(stages.map((s) => s.id));
  const legacyToStageId = new Map<string, string>();
  for (const s of stages) {
    if (s.legacyKey) legacyToStageId.set(s.legacyKey, s.id);
  }
  const firstStageId = stages[0]?.id ?? "";
  const columns: Record<string, ResponseItem[]> = {};
  for (const s of stages) {
    columns[s.id] = [];
  }
  for (const r of responses) {
    let stageId: string;
    if (r.pipelineStageId && stageIds.has(r.pipelineStageId)) {
      stageId = r.pipelineStageId;
    } else {
      const legacyKey = mapResponseToLegacyStage(
        r.status,
        r.hrSelectionStatus ?? null,
      );
      stageId = legacyToStageId.get(legacyKey) ?? firstStageId;
    }
    const col = columns[stageId];
    if (col) col.push(r);
  }
  return columns;
}

function HorizontalScrollWithHints({
  children,
}: {
  children: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
  });
  const [arrowStyle, setArrowStyle] = useState<{
    useFixed: boolean;
    left?: number;
    right?: number;
  }>({ useFixed: false });

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const canScrollLeft = scrollLeft > 0;
    const canScrollRight = scrollLeft + clientWidth < scrollWidth - 1;
    setScrollState((prev) => {
      if (
        prev.canScrollLeft === canScrollLeft &&
        prev.canScrollRight === canScrollRight
      )
        return prev;
      return { canScrollLeft, canScrollRight };
    });
  }, []);

  const updateArrowPosition = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const useFixed = rect.height > vh * 0.8;
    setArrowStyle((prev) => {
      const next = useFixed
        ? {
            useFixed: true,
            left: rect.left + 8,
            right: window.innerWidth - rect.right + 8,
          }
        : { useFixed: false };
      if (
        prev.useFixed === next.useFixed &&
        prev.left === next.left &&
        prev.right === next.right
      )
        return prev;
      return next;
    });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    const ro = new ResizeObserver(() => {
      updateScrollState();
      updateArrowPosition();
    });
    ro.observe(el);
    el.addEventListener("scroll", updateScrollState);
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", updateScrollState);
    };
  }, [updateScrollState, updateArrowPosition]);

  useEffect(() => {
    updateArrowPosition();
    const ro = new ResizeObserver(updateArrowPosition);
    const el = containerRef.current;
    if (el) ro.observe(el);
    window.addEventListener("scroll", updateArrowPosition, true);
    window.addEventListener("resize", updateArrowPosition);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", updateArrowPosition, true);
      window.removeEventListener("resize", updateArrowPosition);
    };
  }, [updateArrowPosition]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const step = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  };

  const hasOverflow = scrollState.canScrollLeft || scrollState.canScrollRight;

  const buttonClass = "size-8 rounded-full shadow-md pointer-events-auto z-20";

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-0 flex-1 flex-col min-w-0"
    >
      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col overflow-x-auto overflow-y-hidden rounded-lg scroll-smooth"
      >
        {children}
      </div>
      {hasOverflow && (
        <>
          {scrollState.canScrollLeft && (
            <>
              <div
                className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 z-10 rounded-l-lg bg-gradient-to-r from-background via-background/60 to-transparent"
                aria-hidden
              />
              {arrowStyle.useFixed && arrowStyle.left != null ? (
                <Button
                  variant="secondary"
                  size="icon"
                  className={buttonClass}
                  style={{
                    position: "fixed",
                    top: "calc(50vh - 1rem)",
                    left: arrowStyle.left,
                  }}
                  onClick={() => scroll("left")}
                  aria-label="Прокрутить влево"
                >
                  <IconChevronLeft className="size-4" />
                </Button>
              ) : (
                <div className="absolute left-0 top-0 bottom-0 w-14 flex items-center justify-center pointer-events-none">
                  <Button
                    variant="secondary"
                    size="icon"
                    className={buttonClass}
                    onClick={() => scroll("left")}
                    aria-label="Прокрутить влево"
                  >
                    <IconChevronLeft className="size-4" />
                  </Button>
                </div>
              )}
            </>
          )}
          {scrollState.canScrollRight && (
            <>
              <div
                className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 z-10 rounded-r-lg bg-gradient-to-l from-background via-background/60 to-transparent"
                aria-hidden
              />
              {arrowStyle.useFixed && arrowStyle.right != null ? (
                <Button
                  variant="secondary"
                  size="icon"
                  className={buttonClass}
                  style={{
                    position: "fixed",
                    top: "calc(50vh - 1rem)",
                    right: arrowStyle.right,
                  }}
                  onClick={() => scroll("right")}
                  aria-label="Прокрутить вправо"
                >
                  <IconChevronRight className="size-4" />
                </Button>
              ) : (
                <div className="absolute right-0 top-0 bottom-0 w-14 flex items-center justify-center pointer-events-none">
                  <Button
                    variant="secondary"
                    size="icon"
                    className={buttonClass}
                    onClick={() => scroll("right")}
                    aria-label="Прокрутить вправо"
                  >
                    <IconChevronRight className="size-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
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
  value: string;
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
  entityId,
  sortKey = "",
}: ResponsesKanbanProps) {
  const router = useRouter();
  const orpc = useORPC();
  const queryClient = useQueryClient();

  const { data: stagesData, isLoading: stagesLoading } = useQuery({
    ...orpc.pipeline.getStages.queryOptions({
      input: { workspaceId, entityType: "vacancy", entityId },
    }),
    enabled: Boolean(workspaceId),
  });

  const stages = stagesData?.stages ?? EMPTY_STAGES;
  const stagesSorted = useMemo(
    () => [...stages].sort((a, b) => a.position - b.position),
    [stages],
  );

  const initialColumns = useMemo(
    () => responsesToColumns(responses, stagesSorted),
    [responses, stagesSorted],
  );
  const [columns, setColumns] = useState(initialColumns);

  const prevSortKeyRef = useRef<string>("");

  // Синхронизируем с сервером при изменении responses или stages:
  // - при смене sortKey (сортировка/фильтры) — используем порядок с сервера
  // - при refetch с теми же параметрами — сохраняем локальный порядок (после drag)
  useEffect(() => {
    if (stagesSorted.length === 0) return;

    const serverColumns = responsesToColumns(responses, stagesSorted);
    const useServerOrder = sortKey !== prevSortKeyRef.current;
    if (useServerOrder) {
      prevSortKeyRef.current = sortKey;
      setColumns(serverColumns);
      return;
    }

    const responseById = new Map(responses.map((r) => [r.id, r]));
    setColumns((prev) => {
      const merged: Record<string, ResponseItem[]> = {};
      for (const s of stagesSorted) {
        const colId = s.id;
        const prevItems = prev[colId] ?? [];
        const serverItems = serverColumns[colId] ?? [];
        const serverIds = new Set(serverItems.map((r) => r.id));

        const mergedItems: ResponseItem[] = [];
        for (const item of prevItems) {
          if (serverIds.has(item.id)) {
            mergedItems.push(responseById.get(item.id) ?? item);
          }
        }
        for (const item of serverItems) {
          if (!mergedItems.some((m) => m.id === item.id)) {
            mergedItems.push(item);
          }
        }
        merged[colId] = mergedItems;
      }
      // Не обновлять, если порядок и состав колонок не изменился — предотвращает цикл
      const keys = Object.keys(merged);
      if (keys.length !== Object.keys(prev).length) return merged;
      for (const k of keys) {
        const prevCol = prev[k] ?? [];
        const nextCol = merged[k] ?? [];
        if (prevCol.length !== nextCol.length) return merged;
        for (let i = 0; i < prevCol.length; i++) {
          if (prevCol[i]?.id !== nextCol[i]?.id) return merged;
        }
      }
      return prev;
    });
  }, [responses, sortKey, stagesSorted]);

  const listWorkspaceQueryKey = {
    input: {
      workspaceId,
      page: 1,
      limit: 50,
      sortField: null,
      sortDirection: "desc" as const,
      screeningFilter: "all" as const,
    },
  };

  const { mutate: moveResponse } = useMutation(
    orpc.pipeline.moveResponse.mutationOptions({
      onError: () => {
        setColumns(responsesToColumns(responses, stagesSorted));
        toast.error("Не удалось переместить отклик");
      },
      onSuccess: () => {
        toast.success("Отклик перемещён");
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.vacancy.responses.listWorkspace.queryKey(
            listWorkspaceQueryKey,
          ),
        });
      },
    }),
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const vacancyMap = useMemo(
    () => new Map(vacancies.map((v) => [v.id, v.title])),
    [vacancies],
  );

  const handleCardClick = useCallback(
    (response: ResponseItem) => {
      router.push(
        paths.workspace.responses(orgSlug, workspaceSlug, response.id),
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
      const pipelineStageId = String(overContainer);
      const activeId = String(dndEvent.active.id);
      const item =
        columns[pipelineStageId]?.find((r) => r.id === activeId) ??
        columns[activeContainer]?.[event.activeIndex];
      if (!item || activeContainer === overContainer) return;

      moveResponse({
        responseId: item.id,
        pipelineStageId,
      });
    },
    [columns, moveResponse],
  );

  const settingsPipelineHref = paths.workspace.settings.pipeline(
    orgSlug,
    workspaceSlug,
  );

  if (!mounted || stagesLoading || stagesSorted.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col space-y-3">
        {stagesLoading && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Загрузка этапов канбана…
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href={settingsPipelineHref} className="gap-2">
                <IconSettings className="size-4" />
                Настроить этапы
              </Link>
            </Button>
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col overflow-x-auto overflow-y-hidden rounded-lg">
          <div className="flex min-h-full min-w-max flex-1 gap-3 pb-2 md:gap-4 items-stretch">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={cn(
                  "flex min-h-full w-[360px] shrink-0 flex-col rounded-lg border-2 border-dashed border-border bg-muted/5 p-3",
                )}
              >
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full shrink-0 bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <Badge variant="secondary" size="sm" className="ml-auto">
                    0
                  </Badge>
                </div>
                <div className="min-h-[420px]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-3">
      <div className="flex items-center justify-end">
        <Button variant="outline" size="sm" asChild>
          <Link href={settingsPipelineHref} className="gap-2">
            <IconSettings className="size-4" />
            Настроить этапы
          </Link>
        </Button>
      </div>
      <Kanban<ResponseItem>
        value={columns}
        onValueChange={setColumns}
        getItemValue={(item) => item.id}
        onMove={handleMove}
        className="flex min-h-0 flex-1 flex-col"
      >
        <HorizontalScrollWithHints>
          <KanbanBoard
            className="flex min-h-full min-w-max flex-1 gap-3 pb-2 md:gap-4 items-stretch"
            aria-label="Канбан-доска откликов"
          >
            {stagesSorted.map((col) => (
              <ResponseKanbanColumn
                key={col.id}
                value={col.id}
                label={col.label}
                color={col.color ?? "bg-slate-500"}
                responses={columns[col.id] ?? []}
                isLoading={isLoading}
                onCardClick={handleCardClick}
                vacancyMap={vacancyMap}
              />
            ))}
          </KanbanBoard>
        </HorizontalScrollWithHints>
        <KanbanOverlay className="bg-muted/10 rounded-lg border-2 border-dashed border-border">
          <div className="h-24 min-w-[200px]" aria-hidden />
        </KanbanOverlay>
      </Kanban>
    </div>
  );
}
