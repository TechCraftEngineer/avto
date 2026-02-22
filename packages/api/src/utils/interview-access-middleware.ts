import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { middleware, publicProcedure } from "../orpc";
import {
  hasInterviewAccess,
  validateInterviewToken,
} from "./interview-token-validator";

/**
 * Input schema для проверки доступа к интервью
 */
export const interviewAccessInputSchema = z.object({
  interviewSessionId: z.uuid().optional(),
  sessionId: z.uuid().optional(),
  interviewToken: z.string().optional(),
});

/**
 * Middleware для проверки доступа к интервью
 * Добавляет проверку доступа к interviewSessionId из input
 */
export const interviewAccessMiddleware = middleware(
  async ({ context, next, input }) => {
    const parsed = interviewAccessInputSchema.safeParse(input);

    if (!parsed.success) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Некорректные параметры для проверки доступа к интервью",
      });
    }

    const { interviewSessionId, sessionId, interviewToken } = parsed.data;
    const actualSessionId = interviewSessionId || sessionId;

    if (!actualSessionId) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Требуется interviewSessionId или sessionId",
      });
    }

    // Валидируем токен из input
    let validatedToken = null;
    if (interviewToken) {
      try {
        validatedToken = await validateInterviewToken(
          interviewToken,
          context.db,
        );
      } catch (error) {
        console.error("Failed to validate interview token:", error);
      }
    }

    // Проверяем доступ к interview session
    const hasAccess = await hasInterviewAccess(
      actualSessionId,
      validatedToken,
      context.db,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этому интервью",
      });
    }

    return next({
      context: {
        ...context,
        // Добавляем информацию о проверенном доступе в контекст
        verifiedInterviewSessionId: actualSessionId,
        validatedInterviewToken: validatedToken,
      },
    });
  },
);

/**
 * Процедура с проверкой доступа к интервью
 * Используется как базовая процедура для роутов, требующих доступа к интервью
 */
export const withInterviewAccess = publicProcedure.use(
  interviewAccessMiddleware,
);
