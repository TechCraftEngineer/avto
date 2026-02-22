import { ORPCError } from "@orpc/server";
import { InterviewLinkGenerator } from "@qbs-autonaim/shared/server";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

const getInterviewLinkInputSchema = z.object({
  vacancyId: z.string().uuid(),
  workspaceId: workspaceIdSchema,
});

/**
 * Получает или создает ссылку на интервью для вакансии
 */
export const getInterviewLink = protectedProcedure
  .input(getInterviewLinkInputSchema)
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

    // Проверяем, существует ли вакансия и принадлежит ли она workspace
    const vacancy = await ctx.db.query.vacancy.findFirst({
      where: (vacancy, { and, eq }) =>
        and(
          eq(vacancy.id, input.vacancyId),
          eq(vacancy.workspaceId, input.workspaceId),
        ),
    });

    if (!vacancy) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    // Генерируем или получаем существующую ссылку на интервью
    const linkGenerator = new InterviewLinkGenerator();
    const interviewLink = await linkGenerator.getOrCreateInterviewLink(
      input.vacancyId,
      input.workspaceId,
    );

    return {
      id: interviewLink.id,
      vacancyId: interviewLink.entityId,
      token: interviewLink.token,
      url: interviewLink.url,
      isActive: interviewLink.isActive,
      createdAt: interviewLink.createdAt,
      expiresAt: interviewLink.expiresAt,
    };
  });
