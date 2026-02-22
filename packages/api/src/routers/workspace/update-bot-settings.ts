import { ORPCError } from "@orpc/server";
import { eq } from "@qbs-autonaim/db";
import { botSettings as botSettingsTable } from "@qbs-autonaim/db/schema";
import {
  updateBotSettingsSchema,
  workspaceIdSchema,
} from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const updateBotSettings = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      data: updateBotSettingsSchema,
    }),
  )
  .handler(async ({ input, context }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access || (access.role !== "owner" && access.role !== "admin")) {
      throw new ORPCError("FORBIDDEN", {
        message: "Недостаточно прав для обновления настроек бота",
      });
    }

    const { workspaceId, data } = input;

    // Проверяем, существует ли уже запись
    const existing = await context.db.query.botSettings.findFirst({
      where: (botSettings, { eq }) => eq(botSettings.workspaceId, workspaceId),
    });

    if (existing) {
      // Обновляем существующую запись
      const updated = await context.db
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
      const created = await context.db
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
