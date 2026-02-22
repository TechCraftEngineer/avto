import { botSettings, eq } from "@qbs-autonaim/db";
import { companyFormSchema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const update = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      data: companyFormSchema,
    }),
  )
  .handler(async ({ context, input }) => {
    // Проверка доступа к workspace
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access || (access.role !== "owner" && access.role !== "admin")) {
      throw new ORPCError("FORBIDDEN", { message: "Недостаточно прав для изменения настроек компании", });
    }

    // Проверяем существующие настройки
    const existing = await context.db.query.botSettings.findFirst({
      where: eq(botSettings.workspaceId, input.workspaceId),
    });

    if (existing) {
      // Обновляем существующие
      const [updated] = await context.db
        .update(botSettings)
        .set({
          companyName: input.data.name,
          companyWebsite: input.data.website || null,
          companyDescription: input.data.description || null,
          updatedAt: new Date(),
        })
        .where(eq(botSettings.id, existing.id))
        .returning();

      return updated;
    }

    // Создаем новые (с дефолтными значениями для бота)
    const [created] = await context.db
      .insert(botSettings)
      .values({
        workspaceId: input.workspaceId,
        companyName: input.data.name,
        companyWebsite: input.data.website || null,
        companyDescription: input.data.description || null,
        botName: "Ассистент",
        botRole: "HR-менеджер",
      })
      .returning();

    return created;
  });
