"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import { Input } from "@qbs-autonaim/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@qbs-autonaim/ui/components/select";
import { cn } from "@qbs-autonaim/ui/utils";
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useORPC } from "~/orpc/react";

const STAGE_COLORS = [
  { value: "bg-blue-500", label: "Синий" },
  { value: "bg-cyan-500", label: "Голубой" },
  { value: "bg-indigo-500", label: "Индиго" },
  { value: "bg-violet-500", label: "Фиолетовый" },
  { value: "bg-amber-500", label: "Янтарный" },
  { value: "bg-emerald-500", label: "Изумрудный" },
  { value: "bg-green-500", label: "Зелёный" },
  { value: "bg-rose-500", label: "Розовый" },
  { value: "bg-slate-500", label: "Сланцевый" },
] as const;

type StageItem = {
  id?: string;
  label: string;
  position: number;
  color: string | null;
};

function SortableStageRow({
  stage,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: {
  stage: StageItem;
  index: number;
  onUpdate: (index: number, updates: Partial<StageItem>) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}) {
  const id = stage.id ?? `new-${index}`;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card px-3 py-2 transition-colors hover:bg-muted/50",
        isDragging && "opacity-90 shadow-md ring-2 ring-primary/20",
      )}
      {...(isDragging ? { inert: true } : {})}
    >
      <button
        type="button"
        className="touch-none cursor-grab rounded p-1 text-muted-foreground transition-colors hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Перетащить для изменения порядка"
      >
        <GripVertical className="size-4 shrink-0" />
      </button>
      <div
        className={cn(
          "size-4 shrink-0 rounded-full border border-border",
          stage.color ?? "bg-muted",
        )}
      />
      <Input
        value={stage.label}
        onChange={(e) => onUpdate(index, { label: e.target.value })}
        placeholder="Название этапа"
        className="h-9 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
      />
      <Select
        value={stage.color ?? ""}
        onValueChange={(v) => onUpdate(index, { color: v || null })}
      >
        <SelectTrigger className="h-9 w-[140px]">
          <SelectValue placeholder="Цвет" />
        </SelectTrigger>
        <SelectContent>
          {STAGE_COLORS.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              <span className="flex items-center gap-2">
                <span className={cn("size-3 rounded-full", c.value)} />
                {c.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        onClick={() => onRemove(index)}
        disabled={!canRemove}
        aria-label="Удалить этап"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

interface VacancyPipelineStagesSettingsProps {
  vacancyId: string;
  workspaceId: string;
}

export function VacancyPipelineStagesSettings({
  vacancyId,
  workspaceId,
}: VacancyPipelineStagesSettingsProps) {
  const orpc = useORPC();
  const queryClient = useQueryClient();
  const [localStages, setLocalStages] = useState<StageItem[] | null>(null);

  const { data, isLoading } = useQuery({
    ...orpc.pipeline.getStages.queryOptions({
      input: workspaceId
        ? { workspaceId, entityType: "vacancy", entityId: vacancyId }
        : skipToken,
    }),
    enabled: Boolean(workspaceId) && Boolean(vacancyId),
  });

  const stages = localStages ?? data?.stages ?? [];
  const hasChanges =
    localStages !== null &&
    JSON.stringify(
      localStages.map((s) => ({
        label: s.label,
        position: s.position,
        color: s.color,
      })),
    ) !==
      JSON.stringify(
        (data?.stages ?? []).map((s) => ({
          label: s.label,
          position: s.position,
          color: s.color,
        })),
      );

  const updateStage = useMutation(
    orpc.pipeline.updateStages.mutationOptions({
      onSuccess: () => {
        setLocalStages(null);
        toast.success("Этапы канбана сохранены");
        queryClient.invalidateQueries({
          queryKey: orpc.pipeline.getStages.queryKey({
            input: { workspaceId, entityType: "vacancy", entityId: vacancyId },
          }),
        });
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : "Не удалось сохранить этапы",
        );
      },
    }),
  );

  const handleUpdate = useCallback(
    (index: number, updates: Partial<StageItem>) => {
      setLocalStages((prev) => {
        const base =
          prev ??
          (data?.stages ?? []).map((s) => ({
            id: s.id,
            label: s.label,
            position: s.position,
            color: s.color,
          }));
        const next = [...base];
        const item = next[index];
        if (item) {
          next[index] = { ...item, ...updates };
        }
        return next;
      });
    },
    [data?.stages],
  );

  const handleRemove = useCallback(
    (index: number) => {
      setLocalStages((prev) => {
        const base =
          prev ??
          (data?.stages ?? []).map((s) => ({
            id: s.id,
            label: s.label,
            position: s.position,
            color: s.color,
          }));
        const next = base.filter((_, i) => i !== index);
        return next.map((s, i) => ({ ...s, position: i }));
      });
    },
    [data?.stages],
  );

  const handleAdd = useCallback(() => {
    setLocalStages((prev) => {
      const base =
        prev ??
        (data?.stages ?? []).map((s) => ({
          id: s.id,
          label: s.label,
          position: s.position,
          color: s.color,
        }));
      return [
        ...base,
        {
          label: "Новый этап",
          position: base.length,
          color: "bg-slate-500",
        },
      ];
    });
  }, [data?.stages]);

  const handleSave = useCallback(() => {
    const toSave = localStages ?? data?.stages ?? [];
    if (toSave.length === 0) return;
    updateStage.mutate({
      workspaceId,
      entityType: "vacancy",
      entityId: vacancyId,
      stages: toSave.map((s, i) => ({
        id: s.id,
        label: s.label,
        position: i,
        color: s.color,
      })),
    });
  }, [localStages, data?.stages, workspaceId, vacancyId, updateStage]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const ids = stages.map((s) => s.id ?? `new-${stages.indexOf(s)}`);
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;
      setLocalStages((prev) => {
        const base = prev ?? stages;
        const next = [...base];
        const [removed] = next.splice(oldIndex, 1);
        if (!removed) return prev ?? stages;
        next.splice(newIndex, 0, removed);
        return next.map((s, i) => ({ ...s, position: i }));
      });
    },
    [stages],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const sortableIds = stages.map((s, i) => s.id ?? `new-${i}`);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Этапы канбан-доски</CardTitle>
        <CardDescription>
          Настройте этапы для отображения откликов на канбан-доске. Порядок
          можно менять перетаскиванием.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-lg bg-muted/50"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleAdd}>
                <Plus className="size-4" />
                Добавить этап
              </Button>
              {hasChanges && (
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updateStage.isPending || stages.length === 0}
                >
                  {updateStage.isPending ? "Сохранение…" : "Сохранить"}
                </Button>
              )}
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortableIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {stages.map((stage, index) => (
                    <SortableStageRow
                      key={stage.id ?? `new-${index}`}
                      stage={stage}
                      index={index}
                      onUpdate={handleUpdate}
                      onRemove={handleRemove}
                      canRemove={stages.length > 1}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {stages.length === 0 && !isLoading && (
              <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                <p>Этапы загружаются при первом просмотре.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={handleAdd}
                >
                  Добавить этап
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
