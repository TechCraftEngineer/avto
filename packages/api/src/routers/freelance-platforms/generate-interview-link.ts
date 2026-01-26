import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { InterviewLinkGenerator } from "../../services";
import { protectedProcedure } from "../../trpc";

const generateInterviewLinkInputSchema = z.object({
  vacancyId: z.uuid(),
  workspaceId: workspaceIdSchema,
});

export const generateInterviewLink = protectedProcedure
  .input(generateInterviewLinkInputSchema)
  .mutation(async ({ input, ctx }) => {
    // Проверка доступа к workspace
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
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
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    // Генерируем ссылку на интервью
    const linkGenerator = new InterviewLinkGenerator();
    const interviewLink = await linkGenerator.getOrCreateInterviewLink(input.vacancyId);

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
