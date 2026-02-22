import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { publicProcedure } from "../orpc";
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
  .use(async ({ context, next, input }) => {
    const { interviewSessionId, sessionId, interviewToken } = input;
    const actualSessionId = interviewSessionId || sessionId;

    if (!actualSessionId) {
      throw new ORPCError("BAD_REQUEST", { message: "Требуется interviewSessionId или sessionId",
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
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к этому интервью",
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
  });
