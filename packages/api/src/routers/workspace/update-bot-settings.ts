import { eq } from "@qbs-autonaim/db";
import { botSettings as botSettingsTable } from "@qbs-autonaim/db/schema";
import {
  updateBotSettingsSchema,
  workspaceIdSchema,
} from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const updateBotSettings = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      data: updateBotSettingsSchema,
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access || (access.role !== "owner" && access.role !== "admin")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для обновления настроек бота",
      });
    }

    const { workspaceId, data } = input;

    // Проверяем, существует ли уже запись
    const existing = await ctx.db.query.botSettings.findFirst({
      where: (botSettings, { eq }) => eq(botSettings.workspaceId, workspaceId),
    });

    if (existing) {
      // Обновляем существующую запись
      const updated = await ctx.db
        .update(botSettingsTable)
        .set({
          ...data,
          companyWebsite: data.companyWebsite || null,
          companyDescription: data.companyDescription || null,
          updatedAt: new Date(),
        })
        .where(eq(botSettingsTable.workspaceId, workspaceId))
        .returning();

      return updated[0];
    } else {
      // Создаем новую запись
      const created = await ctx.db
        .insert(botSettingsTable)
        .values({
          workspaceId,
          ...data,
          companyWebsite: data.companyWebsite || null,
          companyDescription: data.companyDescription || null,
        })
        .returning();

      return created[0];
    }
  });
