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
  .handler(async ({ input, context }) => {
    // Валидируем токен
    const validatedToken = context.interviewToken
      ? await validateInterviewToken(context.interviewToken, context.db)
      : null;

    // Проверяем доступ к interview session
    const hasAccess = await hasInterviewAccess(
      input.interviewSessionId,
      validatedToken,
      context.db,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к этому интервью", });
    }

    // Получаем базовую информацию о сессии для подтверждения доступа
    const session = await context.db.query.interviewSession.findFirst({
      where: (interviewSession, { eq }) =>
        eq(interviewSession.id, input.interviewSessionId),
      columns: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    if (!session) {
      throw new ORPCError("NOT_FOUND", { message: "Интервью не найдено", });
    }

    return {
      hasAccess: true,
      sessionId: session.id,
      status: session.status,
      createdAt: session.createdAt,
    };
  });
