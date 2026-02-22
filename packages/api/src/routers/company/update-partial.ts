import { botSettings, eq } from "@qbs-autonaim/db";
import {
  companyPartialSchema,
  workspaceIdSchema,
} from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const updatePartial = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      data: companyPartialSchema,
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access || (access.role !== "owner" && access.role !== "admin")) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для изменения настроек компании",
      });
    }

    const existing = await ctx.db.query.botSettings.findFirst({
      where: eq(botSettings.workspaceId, input.workspaceId),
    });

    if (!existing) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Настройки компании не найдены",
      });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (input.data.name !== undefined) updateData.companyName = input.data.name;
    if (input.data.website !== undefined)
      updateData.companyWebsite = input.data.website || null;
    if (input.data.description !== undefined)
      updateData.companyDescription = input.data.description || null;

    const [updated] = await ctx.db
      .update(botSettings)
      .set(updateData)
      .where(eq(botSettings.id, existing.id))
      .returning();

    return updated;
  });
