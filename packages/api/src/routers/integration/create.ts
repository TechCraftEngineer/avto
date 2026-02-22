import { upsertIntegration } from "@qbs-autonaim/db";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

/** Типы интеграций, которые создаются только через verify (настройка) */
const CREATE_VIA_VERIFY_ONLY = ["hh", "kwork"] as const;

export const createIntegration = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      type: z.string(),
      name: z.string(),
      credentials: z.record(z.string(), z.string()),
      metadata: z.record(z.string(), z.any()).optional(),
      isActive: z.boolean().optional(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    // HH и Kwork создаются только через verify flow
    if (
      CREATE_VIA_VERIFY_ONLY.includes(
        input.type as (typeof CREATE_VIA_VERIFY_ONLY)[number],
      )
    ) {
      throw new ORPCError({
        code: "BAD_REQUEST",
        message: `Интеграция ${input.type} создаётся только через настройку интеграции`,
      });
    }

    // Проверка доступа к workspace
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access || (access.role !== "owner" && access.role !== "admin")) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для создания интеграций",
      });
    }

    const integration = await upsertIntegration(ctx.db, {
      workspaceId: input.workspaceId,
      type: input.type,
      name: input.name,
      credentials: input.credentials,
      metadata: input.metadata,
      isActive: input.isActive ?? true,
    });

    return {
      id: integration.id,
      type: integration.type,
      name: integration.name,
    };
  });
