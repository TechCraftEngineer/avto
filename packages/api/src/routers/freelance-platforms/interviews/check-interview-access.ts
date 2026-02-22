import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { publicProcedure } from "../../../orpc";
import {
  hasInterviewAccess,
  validateInterviewToken,
} from "../../../utils/interview-token-validator";

const checkInterviewAccessInputSchema = z.object({
  interviewSessionId: z.uuid(),
});

export const checkInterviewAccess = publicProcedure
  .input(checkInterviewAccessInputSchema)
  .query(async ({ input, ctx }) => {
    // Валидируем токен
    const validatedToken = ctx.interviewToken
      ? await validateInterviewToken(ctx.interviewToken, ctx.db)
      : null;

    // Проверяем доступ к interview session
    const hasAccess = await hasInterviewAccess(
      input.interviewSessionId,
      validatedToken,
      ctx.db,
    );

    if (!hasAccess) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому интервью",
      });
    }

    // Получаем базовую информацию о сессии для подтверждения доступа
    const session = await ctx.db.query.interviewSession.findFirst({
      where: (interviewSession, { eq }) =>
        eq(interviewSession.id, input.interviewSessionId),
      columns: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    if (!session) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Интервью не найдено",
      });
    }

    return {
      hasAccess: true,
      sessionId: session.id,
      status: session.status,
      createdAt: session.createdAt,
    };
  });
