import { InterviewLinkGenerator } from "@qbs-autonaim/shared/server";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";
import { verifyWorkspaceAccess } from "../../../utils/workspace-access";

const getInterviewLinkInputSchema = z.object({
  responseId: z.string().uuid(),
  workspaceId: workspaceIdSchema,
});

/**
 * Получает или создает индивидуальную ссылку на интервью для отклика
 */
export const getInterviewLink = protectedProcedure
  .input(getInterviewLinkInputSchema)
  .query(async ({ input, ctx }) => {
    // Проверяем доступ к workspace
    await verifyWorkspaceAccess(
      ctx.workspaceRepository,
      input.workspaceId,
      ctx.session.user.id,
    );

    // Проверяем существование отклика и доступ к нему
    const response = await ctx.db.query.response.findFirst({
      where: (fields, { eq }) => eq(fields.id, input.responseId),
      columns: {
        id: true,
        entityType: true,
        entityId: true,
      },
      with: {
        vacancy: {
          columns: {
            id: true,
            workspaceId: true,
          },
        },
        gig: {
          columns: {
            id: true,
            workspaceId: true,
          },
        },
      },
    });

    if (!response) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Отклик не найден",
      });
    }

    // Получаем workspaceId в зависимости от типа entity
    const workspaceId =
      response.entityType === "vacancy"
        ? response.vacancy?.workspaceId
        : response.gig?.workspaceId;

    // Проверяем что связанная сущность существует
    if (!workspaceId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Связанная сущность не найдена",
      });
    }

    // Проверяем соответствие workspace
    if (workspaceId !== input.workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому отклику",
      });
    }

    // Генерируем или получаем существующую ссылку
    const linkGenerator = new InterviewLinkGenerator();
    const interviewLink = await linkGenerator.getOrCreateResponseInterviewLink(
      input.responseId,
      input.workspaceId,
    );

    return {
      url: interviewLink.url,
      token: interviewLink.token,
      isActive: interviewLink.isActive,
      createdAt: interviewLink.createdAt,
    };
  });
