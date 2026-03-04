"use client";

import type { DragEndEvent } from "@dnd-kit/core";
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useORPC } from "~/orpc/react";

export type StageItem = {
  id?: string;
  clientId?: string;
  label: string;
  position: number;
  color: string | null;
};

export function useVacancyPipelineStages(
  vacancyId: string,
  workspaceId: string,
) {
  const orpc = useORPC();
  const queryClient = useQueryClient();
  const [localStages, setLocalStages] = useState<StageItem[] | null>(null);

  const { data, isLoading, isError, error } = useQuery(
    orpc.pipeline.getStages.queryOptions({
      input:
        workspaceId && vacancyId
          ? { workspaceId, entityType: "vacancy", entityId: vacancyId }
          : skipToken,
    }),
  );

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
          clientId: crypto.randomUUID(),
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
      const ids = stages.map((s, i) => s.id ?? s.clientId ?? `stage-${i}`);
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

  return {
    stages,
    hasChanges,
    isLoading,
    isError,
    error,
    updateStage,
    handleUpdate,
    handleRemove,
    handleAdd,
    handleSave,
    handleDragEnd,
  };
}
