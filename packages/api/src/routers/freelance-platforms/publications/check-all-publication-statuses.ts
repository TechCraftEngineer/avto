import { inngest } from "@qbs-autonaim/jobs/client";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

const checkAllPublicationStatusesInputSchema = z.object({
  workspaceId: workspaceIdSchema,
});

export const checkAllPublicationStatuses = protectedProcedure
  .input(checkAllPublicationStatusesInputSchema)
  .mutation(async ({ input, ctx }) => {
    // Проверка доступа к workspace
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    try {
      // Отправляем событие для массовой проверки статусов публикаций
      await inngest.send({
        name: "vacancy/publications.status.check-all",
        data: {
          workspaceId: input.workspaceId,
        },
      });

      return {
        success: true,
        message: "Запущена массовая проверка статусов публикаций",
      };
    } catch (error) {
      console.error(
        "Ошибка при запуске массовой проверки статусов публикаций:",
        error,
      );
      throw new ORPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось запустить проверку статусов публикаций",
      });
    }
  });
