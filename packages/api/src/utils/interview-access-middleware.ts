import { ORPCError } from "@orpc/server";
import { z } from "zod";
import type { Context } from "../orpc";
import { middleware, publicProcedure } from "../orpc";
import {
  hasInterviewAccess,
  validateInterviewToken,
} from "./interview-token-validator";

/**
 * Input schema для проверки доступа к интервью
 * Используйте .extend() для добавления дополнительных полей в роутерах
 */
export const interviewAccessInputSchema = z.object({
  interviewSessionId: z.uuid().optional(),
  sessionId: z.uuid().optional(),
  interviewToken: z.string().optional(),
});

/**
 * Расширенный контекст с данными интервью
 */
export type InterviewContext = Context & {
  verifiedInterviewSessionId: string;
  validatedInterviewToken: string | null;
};

/**
 * Middleware для проверки доступа к интервью
 * Добавляет verifiedInterviewSessionId в контекст
 */
export const interviewAccessMiddleware = middleware(
  async (
    { context, next },
    input: z.infer<typeof interviewAccessInputSchema>,
  ) => {
    const actualSessionId = input.interviewSessionId || input.sessionId;

    if (!actualSessionId) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Требуется interviewSessionId или sessionId",
      });
    }

    // Валидируем токен
    let validatedToken = null;
    if (input.interviewToken) {
      try {
        validatedToken = await validateInterviewToken(
          input.interviewToken,
          context.db,
        );
      } catch (error) {
        console.error("Failed to validate interview token:", error);
      }
    }

    // Проверяем доступ
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
export const withInterviewAccess = publicProcedure
  .input(interviewAccessInputSchema)
  .use(interviewAccessMiddleware);
