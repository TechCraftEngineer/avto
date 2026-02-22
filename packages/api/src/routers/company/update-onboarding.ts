import { ORPCError } from "@orpc/server";
import { botSettings, eq } from "@qbs-autonaim/db";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const updateOnboarding = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      onboardingCompleted: z.boolean().optional(),
      dismissedGettingStarted: z.boolean().optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    // Проверка доступа к workspace
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access || (access.role !== "owner" && access.role !== "admin")) {
      throw new ORPCError("FORBIDDEN", {
        message: "Недостаточно прав для изменения настроек онбординга",
      });
    }

    // Получаем существующие настройки
    const existing = await context.db.query.botSettings.findFirst({
      where: eq(botSettings.workspaceId, input.workspaceId),
    });

    const updateData: Record<string, Date | boolean> = {
      updatedAt: new Date(),
    };

    if (input.onboardingCompleted !== undefined) {
      updateData.onboardingCompleted = input.onboardingCompleted;
      if (input.onboardingCompleted) {
        updateData.onboardingCompletedAt = new Date();
      }
    }

    if (input.dismissedGettingStarted !== undefined) {
      updateData.dismissedGettingStarted = input.dismissedGettingStarted;
      if (input.dismissedGettingStarted) {
        updateData.dismissedGettingStartedAt = new Date();
      }
    }

    if (existing) {
      // Обновляем существующие
      const [updated] = await context.db
        .update(botSettings)
        .set(updateData)
        .where(eq(botSettings.id, existing.id))
        .returning();

      return updated;
    }

    // Создаем новую с дефолтными значениями
    const [created] = await context.db
      .insert(botSettings)
      .values({
        workspaceId: input.workspaceId,
        companyName: "Моя компания", // Значение по умолчанию
        ...updateData,
      })
      .returning();

    return created;
  });
