import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import { telegramSession } from "@qbs-autonaim/db/schema";
import { tgClientSDK } from "@qbs-autonaim/tg-client/sdk";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { handle2FAError, normalizePhone } from "../utils";

export const reauthorizeSessionRouter = protectedProcedure
  .input(
    z.object({
      sessionId: z.string(),
      workspaceId: z.string(),
      apiId: z.number(),
      apiHash: z.string(),
      phone: z.string().trim(),
      phoneCode: z.string().trim(),
      phoneCodeHash: z.string(),
      sessionData: z.string().optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    try {
      const phone = normalizePhone(input.phone);
      const result = await tgClientSDK.signIn({
        apiId: input.apiId,
        apiHash: input.apiHash,
        phone,
        phoneCode: input.phoneCode.trim(),
        phoneCodeHash: input.phoneCodeHash,
        sessionData: input.sessionData,
      });

      const sessionDataObj = JSON.parse(result.sessionData);
      const updated = await context.db
        .update(telegramSession)
        .set({
          sessionData: sessionDataObj as Record<string, unknown>,
          userInfo: {
            id: result.user.id,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            username: result.user.username,
            phone: result.user.phone,
          },
          isActive: true,
          authError: null,
          authErrorAt: null,
          authErrorNotifiedAt: null,
          lastUsedAt: new Date(),
        })
        .where(
          and(
            eq(telegramSession.id, input.sessionId),
            eq(telegramSession.workspaceId, input.workspaceId),
          ),
        )
        .returning();

      if (updated.length === 0) {
        throw new ORPCError("NOT_FOUND", { message: "Сессия не найдена" });
      }

      return {
        success: true,
        sessionId: input.sessionId,
        user: result.user,
      };
    } catch (error) {
      console.error("Ошибка реавторизации:", error);

      const twoFAResponse = handle2FAError(error, input.sessionData);
      if (twoFAResponse) {
        return {
          success: false,
          ...twoFAResponse,
        };
      }

      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message:
          error instanceof Error ? error.message : "Ошибка реавторизации",
      });
    }
  });
