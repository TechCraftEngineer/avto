import { ORPCError } from "@orpc/server";
import { and, asc, eq, isNull } from "@qbs-autonaim/db";
import { pipelineStage } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

const COMMON_STAGE_DEFAULTS = [
  { label: "Контакт", position: 0, color: "bg-blue-500", legacyKey: null },
  { label: "HR интервью", position: 1, color: "bg-cyan-500", legacyKey: null },
  {
    label: "Резюме у заказчика",
    position: 2,
    color: "bg-indigo-500",
    legacyKey: null,
  },
  {
    label: "Интервью с заказчиком",
    position: 3,
    color: "bg-violet-500",
    legacyKey: null,
  },
  {
    label: "Тестовое задание",
    position: 4,
    color: "bg-amber-500",
    legacyKey: null,
  },
  { label: "Оффер", position: 5, color: "bg-emerald-500", legacyKey: null },
  {
    label: "Вышел на работу",
    position: 6,
    color: "bg-green-500",
    legacyKey: null,
  },
  {
    label: "Отказ от оффера",
    position: 7,
    color: "bg-rose-500",
    legacyKey: null,
  },
  { label: "Резерв", position: 8, color: "bg-slate-500", legacyKey: null },
] as const;

const VACANCY_DEFAULTS = COMMON_STAGE_DEFAULTS;
const PROJECT_DEFAULTS = COMMON_STAGE_DEFAULTS;
const GIG_DEFAULTS = COMMON_STAGE_DEFAULTS;

const entityTypeSchema = z.enum(["gig", "vacancy", "project"]);

export const getStages = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      entityType: entityTypeSchema,
      entityId: z.string().uuid().optional(),
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

    // 1. If entityId provided, try to find entity-specific stages
    if (input.entityId) {
      const entityStages = await context.db.query.pipelineStage.findMany({
        where: and(
          eq(pipelineStage.workspaceId, input.workspaceId),
          eq(pipelineStage.entityType, input.entityType),
          eq(pipelineStage.entityId, input.entityId),
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

      if (entityStages.length > 0) {
        return { stages: entityStages };
      }
    }

    // 2. Get default stages (entity_id IS NULL)
    const defaultStages = await context.db.query.pipelineStage.findMany({
      where: and(
        eq(pipelineStage.workspaceId, input.workspaceId),
        eq(pipelineStage.entityType, input.entityType),
        isNull(pipelineStage.entityId),
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

    // 3. Lazy init: if no default stages, create in transaction to avoid races
    if (defaultStages.length === 0) {
      const defaults =
        input.entityType === "vacancy"
          ? VACANCY_DEFAULTS
          : input.entityType === "project"
            ? PROJECT_DEFAULTS
            : GIG_DEFAULTS;

      const inserted = await context.db.transaction(async (tx) => {
        const recheck = await tx.query.pipelineStage.findMany({
          where: and(
            eq(pipelineStage.workspaceId, input.workspaceId),
            eq(pipelineStage.entityType, input.entityType),
            isNull(pipelineStage.entityId),
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
        if (recheck.length > 0) return recheck;
        try {
          await tx.insert(pipelineStage).values(
            defaults.map((d) => ({
              workspaceId: input.workspaceId,
              entityType: input.entityType,
              entityId: null,
              label: d.label,
              position: d.position,
              color: d.color,
              legacyKey: d.legacyKey,
            })),
          );
        } catch (err: unknown) {
          const code = (err as { code?: string })?.code;
          if (code === "23505") {
            const rows = await tx.query.pipelineStage.findMany({
              where: and(
                eq(pipelineStage.workspaceId, input.workspaceId),
                eq(pipelineStage.entityType, input.entityType),
                isNull(pipelineStage.entityId),
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
            return rows;
          }
          throw err;
        }
        const rows = await tx.query.pipelineStage.findMany({
          where: and(
            eq(pipelineStage.workspaceId, input.workspaceId),
            eq(pipelineStage.entityType, input.entityType),
            isNull(pipelineStage.entityId),
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
        return rows;
      });
      return { stages: inserted };
    }

    return { stages: defaultStages };
  });
