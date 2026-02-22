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
  .mutation(async ({ ctx, input }) => {
    // Проверка доступа к workspace
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

    // Проверяем существующие настройки
    const existing = await ctx.db.query.botSettings.findFirst({
      where: eq(botSettings.workspaceId, input.workspaceId),
    });

    if (existing) {
      // Обновляем существующие
      const [updated] = await ctx.db
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
    const [created] = await ctx.db
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
