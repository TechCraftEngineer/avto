import { and, eq } from "@qbs-autonaim/db";
import { response as responseTable } from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../../trpc";
import {
  hasVacancyAccess,
  validateInterviewToken,
} from "../../../utils/interview-token-validator";

const checkDuplicateResponseInputSchema = z.object({
  vacancyId: z.uuid(),
  platformProfileUrl: z.string().min(1),
});

export const checkDuplicateResponse = publicProcedure
  .input(checkDuplicateResponseInputSchema)
  .query(async ({ input, ctx }) => {
    // Валидируем токен
    const validatedToken = ctx.interviewToken
      ? await validateInterviewToken(ctx.interviewToken, ctx.db)
      : null;

    // Проверяем авторизацию: либо валидный токен для этой вакансии, либо авторизованный пользователь
    const hasTokenAccess = hasVacancyAccess(validatedToken, input.vacancyId);
    const isAuthenticated = !!ctx.session?.user;

    if (!hasTokenAccess && !isAuthenticated) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Требуется авторизация или валидный токен интервью",
      });
    }

    // Если пользователь авторизован, проверяем доступ к workspace вакансии
    if (isAuthenticated && !hasTokenAccess) {
      const vacancy = await ctx.db.query.vacancy.findFirst({
        where: (v, { eq }) => eq(v.id, input.vacancyId),
      });

      if (!vacancy) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Вакансия не найдена",
        });
      }

      const userId = ctx.session?.user?.id;
      if (userId) {
        const workspaceMember = await ctx.db.query.workspaceMember.findFirst({
          where: (member, { eq, and }) =>
            and(
              eq(member.workspaceId, vacancy.workspaceId),
              eq(member.userId, userId),
            ),
        });

        if (!workspaceMember) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Нет доступа к этой вакансии",
          });
        }
      }
    }

    // Проверяем дубликаты по platformProfileUrl + vacancyId
    const existingResponse = await ctx.db.query.response.findFirst({
      where: and(
        eq(responseTable.entityId, input.vacancyId),
        eq(responseTable.entityType, "vacancy"),
        eq(responseTable.profileUrl, input.platformProfileUrl),
      ),
    });

    return {
      isDuplicate: !!existingResponse,
      existingResponseId: existingResponse?.id,
    };
  });
