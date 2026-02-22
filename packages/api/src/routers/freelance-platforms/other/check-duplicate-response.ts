import { and, eq } from "@qbs-autonaim/db";
import { response as responseTable } from "@qbs-autonaim/db/schema";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { publicProcedure } from "../../../orpc";
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
  .handler(async ({ input, context }) => {
    // Валидируем токен
    const validatedToken = context.interviewToken
      ? await validateInterviewToken(context.interviewToken, context.db)
      : null;

    // Проверяем авторизацию: либо валидный токен для этой вакансии, либо авторизованный пользователь
    const hasTokenAccess = hasVacancyAccess(validatedToken, input.vacancyId);
    const isAuthenticated = !!context.session?.user;

    if (!hasTokenAccess && !isAuthenticated) {
      throw new ORPCError("UNAUTHORIZED", { message: "Требуется авторизация или валидный токен интервью", });
    }

    // Если пользователь авторизован, проверяем доступ к workspace вакансии
    if (isAuthenticated && !hasTokenAccess) {
      const vacancy = await context.db.query.vacancy.findFirst({
        where: (v, { eq }) => eq(v.id, input.vacancyId),
      });

      if (!vacancy) {
        throw new ORPCError("NOT_FOUND", { message: "Вакансия не найдена", });
      }

      const userId = context.session?.user?.id;
      if (userId) {
        const workspaceMember = await context.db.query.workspaceMember.findFirst({
          where: (member, { eq, and }) =>
            and(
              eq(member.workspaceId, vacancy.workspaceId),
              eq(member.userId, userId),
            ),
        });

        if (!workspaceMember) {
          throw new ORPCError("FORBIDDEN", { message: "Нет доступа к этой вакансии", });
        }
      }
    }

    // Проверяем дубликаты по platformProfileUrl + vacancyId
    const existingResponse = await context.db.query.response.findFirst({
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
