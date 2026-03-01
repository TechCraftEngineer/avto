"use client";

import { useSortable } from "@dnd-kit/sortable";
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
import { cn } from "@qbs-autonaim/ui/utils";
import { GripVertical, Trash2 } from "lucide-react";
import type { StageItem } from "./use-vacancy-pipeline-stages";

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

interface SortableStageRowProps {
  stage: StageItem;
  index: number;
  onUpdate: (index: number, updates: Partial<StageItem>) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export function SortableStageRow({
  stage,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: SortableStageRowProps) {
  const id = stage.id ?? stage.clientId!;
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
      inert={isDragging || undefined}
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
        aria-label="Название этапа"
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
