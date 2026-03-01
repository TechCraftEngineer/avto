"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import { AlertCircle, Plus } from "lucide-react";
import { SortableStageRow } from "./stage-row";
import { useVacancyPipelineStages } from "./use-vacancy-pipeline-stages";

interface VacancyPipelineStagesSettingsProps {
  vacancyId: string;
  workspaceId: string;
}

export function VacancyPipelineStagesSettings({
  vacancyId,
  workspaceId,
}: VacancyPipelineStagesSettingsProps) {
  const {
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
  } = useVacancyPipelineStages(vacancyId, workspaceId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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
        {isError ? (
          <div
            className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center"
            role="alert"
          >
            <AlertCircle className="mx-auto mb-3 h-12 w-12 text-destructive opacity-50" />
            <p className="text-sm font-medium text-destructive">
              Не удалось загрузить этапы канбана
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {error instanceof Error ? error.message : "Неизвестная ошибка"}
            </p>
          </div>
        ) : isLoading ? (
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

            {stages.length === 0 && (
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
