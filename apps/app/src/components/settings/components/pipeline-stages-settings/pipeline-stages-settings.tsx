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
import { Input } from "@qbs-autonaim/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@qbs-autonaim/ui/components/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@qbs-autonaim/ui/components/tabs";
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
import { useWorkspace } from "~/hooks/use-workspace";
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
        "flex items-center gap-2 rounded-lg border bg-background p-2",
        isDragging && "opacity-80 shadow-md select-none",
      )}
      {...(isDragging ? { inert: true } : {})}
    >
      <button
        type="button"
        className="touch-none cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing min-w-6 min-h-6 p-2 -m-2 flex items-center justify-center sm:min-w-11 sm:min-h-11 sm:p-[10px] sm:-m-[10px]"
        {...attributes}
        {...listeners}
        aria-label="Перетащить для изменения порядка"
      >
        <GripVertical className="size-4 shrink-0" />
      </button>
      <div
        className={cn(
          "size-5 shrink-0 rounded-full",
          stage.color ?? "bg-muted",
        )}
      />
      <Input
        value={stage.label}
        onChange={(e) => onUpdate(index, { label: e.target.value })}
        placeholder="Название этапа"
        className="flex-1"
      />
      <Select
        value={stage.color ?? ""}
        onValueChange={(v) => onUpdate(index, { color: v || null })}
      >
        <SelectTrigger className="w-[140px]">
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
        className="text-muted-foreground hover:text-destructive"
        onClick={() => onRemove(index)}
        disabled={!canRemove}
        aria-label="Удалить этап"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

function PipelineStagesTab({
  entityType,
  workspaceId,
}: {
  entityType: "vacancy" | "gig";
  workspaceId: string;
}) {
  const orpc = useORPC();
  const queryClient = useQueryClient();
  const [localStages, setLocalStages] = useState<StageItem[] | null>(null);

  const { data, isLoading } = useQuery({
    ...orpc.pipeline.getStages.queryOptions({
      input: workspaceId ? { workspaceId, entityType } : skipToken,
    }),
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
        toast.success("Этапы сохранены");
        queryClient.invalidateQueries({
          queryKey: orpc.pipeline.getStages.queryKey({
            input: { workspaceId, entityType },
          }),
        });
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : "Не удалось сохранить",
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
      entityType,
      stages: toSave.map((s, i) => ({
        id: s.id,
        label: s.label,
        position: i,
        color: s.color,
      })),
    });
  }, [localStages, data?.stages, workspaceId, entityType, updateStage]);

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

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  const sortableIds = stages.map((s, i) => s.id ?? `new-${i}`);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Настройте этапы для канбан-доски. Порядок можно менять
          перетаскиванием.
        </p>
        <div className="flex gap-2">
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

      {stages.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p className="text-sm">Этапы загружаются при первом просмотре.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={handleAdd}
          >
            Добавить этап
          </Button>
        </div>
      )}
    </div>
  );
}

export function PipelineStagesSettings() {
  const { workspace } = useWorkspace();

  if (!workspace?.id) {
    return (
      <p className="text-sm text-muted-foreground">
        Загрузка рабочего пространства…
      </p>
    );
  }

  return (
    <Tabs defaultValue="vacancy" className="w-full">
      <TabsList>
        <TabsTrigger value="vacancy">Вакансии</TabsTrigger>
        <TabsTrigger value="gig">Задания (gig)</TabsTrigger>
      </TabsList>
      <TabsContent value="vacancy" className="mt-4">
        <PipelineStagesTab entityType="vacancy" workspaceId={workspace.id} />
      </TabsContent>
      <TabsContent value="gig" className="mt-4">
        <PipelineStagesTab entityType="gig" workspaceId={workspace.id} />
      </TabsContent>
    </Tabs>
  );
}
