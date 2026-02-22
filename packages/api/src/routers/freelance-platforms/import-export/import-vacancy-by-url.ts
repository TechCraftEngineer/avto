import { ImportByUrlSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { verifyWorkspaceAccess } from "../../../utils/verify-workspace-access";

/**
 * Импорт вакансии по URL
 * Отправляет событие в Inngest для асинхронной обработки
 */
export const importVacancyByUrl = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      url: ImportByUrlSchema.shape.url,
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { workspaceId, url } = input;

    // Проверка доступа к workspace
    await verifyWorkspaceAccess(
      ctx.workspaceRepository,
      workspaceId,
      ctx.session.user.id,
    );

    // Генерируем уникальный ID для отслеживания запроса
    const requestId = crypto.randomUUID();

    // Отправляем событие в Inngest для асинхронной обработки
    try {
      await ctx.inngest.send({
        name: "vacancy/import.by-url",
        data: {
          workspaceId,
          url,
          requestId,
        },
      });

      return {
        success: true,
        requestId,
        message: "Импорт вакансии запущен",
      };
    } catch (error) {
      console.error("Ошибка при отправке события импорта:", error);
      throw new ORPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось запустить импорт вакансии",
      });
    }
  });
