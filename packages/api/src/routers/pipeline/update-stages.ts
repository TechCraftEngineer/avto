import { ORPCError } from "@orpc/server";
import { and, asc, eq, inArray, isNull, sql } from "@qbs-autonaim/db";
import {
  pipelineStage,
  response as responseTable,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

const stageInputSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1).max(200),
  position: z.number().int().min(0),
  color: z.string().max(50).optional().nullable(),
});

export const updateStages = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      entityType: z.enum(["gig", "vacancy", "project"]),
      entityId: z.string().uuid().optional(),
      stages: z.array(stageInputSchema).min(1),
    }),
  )
  .handler(async ({ input, context }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );
    if (!access) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к workspace" });
    }

    const entityId = input.entityId ?? null;

    return context.db.transaction(async (tx) => {
      const existingStages = await tx.query.pipelineStage.findMany({
        where: and(
          eq(pipelineStage.workspaceId, input.workspaceId),
          eq(pipelineStage.entityType, input.entityType),
          entityId === null
            ? isNull(pipelineStage.entityId)
            : eq(pipelineStage.entityId, entityId),
        ),
        columns: { id: true, position: true },
      });

      const existingIds = new Set(existingStages.map((s) => s.id));
      // Когда entityId задан и у сущности ещё нет своих этапов — все этапы создаём заново, id игнорируем
      const isInitialCreate = entityId !== null && existingStages.length === 0;

      const inputIdsRaw = input.stages
        .map((s) => s.id)
        .filter((id): id is string => !!id);
      const inputIds = new Set(inputIdsRaw);
      if (!isInitialCreate && inputIdsRaw.length !== inputIds.size) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Обнаружены дублирующиеся id этапов",
        });
      }
      if (!isInitialCreate) {
        for (const id of inputIds) {
          if (!existingIds.has(id)) {
            throw new ORPCError("BAD_REQUEST", {
              message: `Неизвестный id этапа: ${id}`,
            });
          }
        }
      }
      const toDelete = isInitialCreate
        ? []
        : existingStages.filter((s) => !inputIds.has(s.id));

      // Check if stages to delete have responses (batch query)
      if (toDelete.length > 0) {
        const counts = await tx
          .select({
            pipelineStageId: responseTable.pipelineStageId,
            count: sql<number>`count(*)::int`,
          })
          .from(responseTable)
          .where(
            inArray(
              responseTable.pipelineStageId,
              toDelete.map((s) => s.id).filter((id): id is string => !!id),
            ),
          )
          .groupBy(responseTable.pipelineStageId);

        const countByStage = new Map<string, number>(
          counts.map(
            (row: { pipelineStageId: string | null; count: number }) => [
              row.pipelineStageId ?? "",
              Number(row.count) || 0,
            ],
          ),
        );
        for (const stage of toDelete) {
          const count = countByStage.get(stage.id) ?? 0;
          if (count > 0) {
            throw new ORPCError("BAD_REQUEST", {
              message: `Этап содержит ${count} откликов. Переместите их перед удалением.`,
            });
          }
        }
      }

      const ownershipWhere = and(
        eq(pipelineStage.workspaceId, input.workspaceId),
        eq(pipelineStage.entityType, input.entityType),
        entityId === null
          ? isNull(pipelineStage.entityId)
          : eq(pipelineStage.entityId, entityId),
      );

      // Delete removed stages (with ownership check)
      if (toDelete.length > 0) {
        await tx.delete(pipelineStage).where(
          and(
            ownershipWhere,
            inArray(
              pipelineStage.id,
              toDelete.map((s) => s.id),
            ),
          ),
        );
      }

      for (let i = 0; i < input.stages.length; i++) {
        const s = input.stages[i];
        if (!s) continue;
        const stageId = s.id;
        const shouldUpdate =
          !isInitialCreate && stageId && existingIds.has(stageId);
        if (shouldUpdate && stageId) {
          await tx
            .update(pipelineStage)
            .set({
              label: s.label,
              position: i,
              color: s.color ?? null,
              updatedAt: new Date(),
            })
            .where(and(eq(pipelineStage.id, stageId), ownershipWhere));
        } else {
          await tx.insert(pipelineStage).values({
            workspaceId: input.workspaceId,
            entityType: input.entityType,
            entityId,
            label: s.label,
            position: i,
            color: s.color ?? null,
          });
        }
      }

      const stages = await tx.query.pipelineStage.findMany({
        where: and(
          eq(pipelineStage.workspaceId, input.workspaceId),
          eq(pipelineStage.entityType, input.entityType),
          entityId === null
            ? isNull(pipelineStage.entityId)
            : eq(pipelineStage.entityId, entityId),
        ),
        orderBy: [asc(pipelineStage.position)],
        columns: {
          id: true,
          label: true,
          position: true,
          color: true,
          legacyKey: true,
        },
      });

      return { stages };
    });
  });
