import { ImportByUrlSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

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
    const workspace = await ctx.db.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { ownerId: ctx.session.user.id },
          {
            members: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        ],
      },
    });

    if (!workspace) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к рабочему пространству",
      });
    }

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
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось запустить импорт вакансии",
      });
    }
  });
