/**
 * Create Prequalification Session Procedure
 *
 * ������ ����� ������ ��������������� ��� ���������.
 * ��������� ��������� - �� ������� ����������� ������������.
 */

import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { publicProcedure } from "../../orpc";
import { SessionManager } from "../../services/prequalification";
import { PrequalificationError } from "../../services/prequalification/types";

const createSessionInputSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId ����������"),
  vacancyId: z.uuid("vacancyId ������ ���� UUID"),
  candidateConsent: z.boolean(),
  source: z.enum(["widget", "direct"]).default("widget"),
});

export const createSession = publicProcedure
  .input(createSessionInputSchema)
  .handler(async ({ context, input }) => {
    const sessionManager = new SessionManager(context.db);

    try {
      const result = await sessionManager.createSession({
        workspaceId: input.workspaceId,
        vacancyId: input.vacancyId,
        candidateConsent: input.candidateConsent,
        source: input.source,
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
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

        throw new ORPCError(codeMap[error.code] ?? "INTERNAL_SERVER_ERROR", {
          message: error.userMessage,
          cause: error,
        });
      }

      // Wrap unknown errors to prevent leaking implementation details
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "���������� ������ �������",
        cause: error,
      });
    }
  });
