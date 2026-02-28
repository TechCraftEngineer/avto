import { ORPCError } from "@orpc/server";
import { ImportByUrlSchema, workspaceIdSchema } from "@qbs-autonaim/validators";
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
      workspaceId: workspaceIdSchema,
      url: ImportByUrlSchema.shape.url,
    }),
  )
  .handler(async ({ input, context }) => {
    const { workspaceId, url } = input;

    // Проверка доступа к workspace
    await verifyWorkspaceAccess(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
    );

    // Генерируем уникальный ID для отслеживания запроса
    const requestId = crypto.randomUUID();

    // Отправляем событие в Inngest для асинхронной обработки
    try {
      await context.inngest.send({
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
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Не удалось запустить импорт вакансии",
      });
    }
  });
