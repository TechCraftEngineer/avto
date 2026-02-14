/**
 * Get Session Procedure
 *
 * Получает текущее состояние сессии преквалификации.
 * Публичная процедура - не требует авторизации пользователя.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { SessionManager } from "../../services/prequalification";
import { PrequalificationError } from "../../services/prequalification/types";
import { publicProcedure } from "../../trpc";

const getSessionInputSchema = z.object({
  sessionId: z.uuid("sessionId должен быть UUID"),
  workspaceId: z.string().min(1, "workspaceId обязателен"),
});

export const getSession = publicProcedure
  .input(getSessionInputSchema)
  .query(async ({ ctx, input }) => {
    try {
      const sessionManager = new SessionManager(ctx.db);

      const session = await sessionManager.getSession(
        input.sessionId,
        input.workspaceId,
      );

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Сессия не найдена",
        });
      }

      return {
        id: session.id,
        status: session.status,
        vacancyId: session.vacancyId,
        hasResume: !!session.parsedResume,
        hasInterviewSession: !!session.interviewSessionId,
        fitScore: session.fitScore,
        fitDecision: session.fitDecision,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      };
    } catch (error) {
      if (error instanceof PrequalificationError) {
        // Маппинг кодов ошибок PrequalificationError на TRPC коды
        const codeMap: Record<
          string,
          "NOT_FOUND" | "FORBIDDEN" | "BAD_REQUEST" | "INTERNAL_SERVER_ERROR"
        > = {
          SESSION_NOT_FOUND: "NOT_FOUND",
          SESSION_EXPIRED: "BAD_REQUEST",
          TENANT_MISMATCH: "FORBIDDEN",
          VACANCY_NOT_FOUND: "NOT_FOUND",
          INVALID_STATE_TRANSITION: "BAD_REQUEST",
          CONSENT_REQUIRED: "BAD_REQUEST",
          RESUME_REQUIRED: "BAD_REQUEST",
          INSUFFICIENT_DIALOGUE: "BAD_REQUEST",
          EVALUATION_FAILED: "BAD_REQUEST",
          ALREADY_SUBMITTED: "BAD_REQUEST",
          CONVERSATION_CREATION_FAILED: "BAD_REQUEST",
        };

        const trpcCode = codeMap[error.code] ?? "INTERNAL_SERVER_ERROR";

        throw new TRPCError({
          code: trpcCode,
          message: error.userMessage,
        });
      }

      // Пробрасываем другие ошибки
      throw error;
    }
  });
