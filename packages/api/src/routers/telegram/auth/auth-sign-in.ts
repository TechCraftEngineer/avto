import { ORPCError } from "@orpc/server";
import { eq } from "@qbs-autonaim/db";
import { telegramSession } from "@qbs-autonaim/db/schema";
import { encryptApiKeys, getEncryptionKey } from "@qbs-autonaim/server-utils";
import { tgClientSDK } from "@qbs-autonaim/tg-client/sdk";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { handle2FAError, normalizePhone } from "../utils";

export const signInRouter = protectedProcedure
  .input(
    z.object({
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
      const existingSession = await context.db.query.telegramSession.findFirst({
        where: eq(telegramSession.workspaceId, input.workspaceId),
      });

      if (existingSession) {
        throw new ORPCError("CONFLICT", {
          message:
            "В этом workspace уже подключен Telegram аккаунт. Удалите существующий аккаунт перед добавлением нового.",
        });
      }

      const phone = normalizePhone(input.phone);
      const result = await tgClientSDK.signIn({
        apiId: input.apiId,
        apiHash: input.apiHash,
        phone,
        phoneCode: input.phoneCode.trim(),
        phoneCodeHash: input.phoneCodeHash,
        sessionData: input.sessionData,
      });

      // result.sessionData уже является JSON-строкой, парсим её
      const sessionDataObj = JSON.parse(result.sessionData);

      // Encrypt sensitive data before storing
      const encryptionKey = getEncryptionKey();
      const encryptedApiData = await encryptApiKeys(
        {
          apiId: input.apiId.toString(),
          apiHash: input.apiHash,
        },
        encryptionKey,
      );

      const [session] = await context.db
        .insert(telegramSession)
        .values({
          workspaceId: input.workspaceId,
          apiId: encryptedApiData.apiId,
          apiHash: encryptedApiData.apiHash,
          phone,
          sessionData: sessionDataObj as Record<string, unknown>,
          userInfo: {
            id: result.user.id,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            username: result.user.username,
            phone: result.user.phone,
          },
          lastUsedAt: new Date(),
        })
        .returning();

      return {
        success: true,
        sessionId: session?.id,
        user: result.user,
      };
    } catch (error) {
      console.error("Ошибка авторизации:", error);

      const twoFAResponse = handle2FAError(error, input.sessionData);
      if (twoFAResponse) {
        return {
          success: false,
          ...twoFAResponse,
        };
      }

      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: error instanceof Error ? error.message : "Ошибка авторизации",
      });
    }
  });
