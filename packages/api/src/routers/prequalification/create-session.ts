/**
 * Create Prequalification Session Procedure
 *
 * Создаёт новую сессию преквалификации для кандидата.
 * Публичная процедура - не требует авторизации пользователя.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { SessionManager } from "../../services/prequalification";
import { PrequalificationError } from "../../services/prequalification/types";
import { publicProcedure } from "../../trpc";

const createSessionInputSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId обязателен"),
  vacancyId: z.uuid("vacancyId должен быть UUID"),
  candidateConsent: z.boolean(),
  source: z.enum(["widget", "direct"]).default("widget"),
});

export const createSession = publicProcedure
  .input(createSessionInputSchema)
  .mutation(async ({ ctx, input }) => {
    const sessionManager = new SessionManager(ctx.db);

    try {
      const result = await sessionManager.createSession({
        workspaceId: input.workspaceId,
        vacancyId: input.vacancyId,
        candidateConsent: input.candidateConsent,
        source: input.source,
        userAgent: ctx.userAgent,
        ipAddress: ctx.ipAddress,
      });

      return {
        sessionId: result.sessionId,
        status: result.status,
        expiresAt: result.expiresAt,
      };
    } catch (error) {
      if (error instanceof PrequalificationError) {
        const codeMap: Record<
          string,
          "BAD_REQUEST" | "NOT_FOUND" | "FORBIDDEN"
        > = {
          CONSENT_REQUIRED: "BAD_REQUEST",
          VACANCY_NOT_FOUND: "NOT_FOUND",
          TENANT_MISMATCH: "FORBIDDEN",
        };

        throw new TRPCError({
          code: codeMap[error.code] ?? "INTERNAL_SERVER_ERROR",
          message: error.userMessage,
          cause: error,
        });
      }

      // Wrap unknown errors to prevent leaking implementation details
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Внутренняя ошибка сервера",
        cause: error,
      });
    }
  });
