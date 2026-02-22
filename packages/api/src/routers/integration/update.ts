import {
  eq,
  getIntegration,
  getIntegrationCredentials,
  integration,
  upsertIntegration,
} from "@qbs-autonaim/db";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

/** Типы интеграций, у которых credentials меняются только при настройке (verify) */
const CREDENTIALS_LOCKED_TYPES = ["hh", "kwork"] as const;

export const updateIntegration = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      type: z.string(),
      name: z.string().optional(),
      credentials: z.record(z.string(), z.string()).optional(),
      metadata: z.record(z.string(), z.any()).optional(),
      isActive: z.boolean().optional(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    // Проверка доступа к workspace
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access || (access.role !== "owner" && access.role !== "admin")) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для изменения интеграций",
      });
    }

    const existing = await getIntegration(
      ctx.db,
      input.type,
      input.workspaceId,
    );

    if (!existing) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Интеграция не найдена",
      });
    }

    // credentials для HH и Kwork меняются только при настройке (verify)
    if (
      CREDENTIALS_LOCKED_TYPES.includes(
        input.type as (typeof CREDENTIALS_LOCKED_TYPES)[number],
      )
    ) {
      const [updated] = await ctx.db
        .update(integration)
        .set({
          name: input.name ?? existing.name,
          metadata: (input.metadata ?? existing.metadata) as
            | Record<string, unknown>
            | undefined,
          isActive: input.isActive ?? existing.isActive,
          updatedAt: new Date(),
        })
        .where(eq(integration.id, existing.id))
        .returning({
          id: integration.id,
          type: integration.type,
          name: integration.name,
        });

      if (!updated)
        throw new ORPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Ошибка обновления",
        });
      return { id: updated.id, type: updated.type, name: updated.name };
    }

    const credentials =
      input.credentials ??
      (await getIntegrationCredentials(
        ctx.db,
        input.type,
        input.workspaceId,
      )) ??
      {};

    const updated = await upsertIntegration(ctx.db, {
      workspaceId: input.workspaceId,
      type: input.type,
      name: input.name ?? existing.name,
      credentials,
      metadata: input.metadata ?? existing.metadata,
      isActive: input.isActive ?? existing.isActive,
    });

    return {
      id: updated.id,
      type: updated.type,
      name: updated.name,
    };
  });
