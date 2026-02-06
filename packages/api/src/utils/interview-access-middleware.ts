import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../trpc";
import {
  hasInterviewAccess,
  validateInterviewToken,
} from "./interview-token-validator";

/**
 * Middleware для проверки доступа к интервью
 * Добавляет проверку доступа к interviewSessionId из input
 */
export const withInterviewAccess = publicProcedure
  .input(
    z.object({
      interviewSessionId: z.uuid().optional(),
      sessionId: z.uuid().optional(),
      interviewToken: z.string().optional(),
    }),
  )
  .use(async ({ ctx, next, input }) => {
    const { interviewSessionId, sessionId, interviewToken } = input;
    const actualSessionId = interviewSessionId || sessionId;

    if (!actualSessionId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Требуется interviewSessionId или sessionId",
      });
    }

    // Валидируем токен из input
    let validatedToken = null;
    if (interviewToken) {
      try {
        validatedToken = await validateInterviewToken(interviewToken, ctx.db);
      } catch (error) {
        console.error("Failed to validate interview token:", error);
      }
    }

    // Проверяем доступ к interview session
    const hasAccess = await hasInterviewAccess(
      actualSessionId,
      validatedToken,
      ctx.db,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому интервью",
      });
    }

    return next({
      ctx: {
        ...ctx,
        // Добавляем информацию о проверенном доступе в контекст
        verifiedInterviewSessionId: actualSessionId,
        validatedInterviewToken: validatedToken,
      },
    });
  });
