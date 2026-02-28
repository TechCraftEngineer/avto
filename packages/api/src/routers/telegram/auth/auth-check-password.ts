import { ORPCError } from "@orpc/server";
import { eq } from "@qbs-autonaim/db";
import { telegramSession } from "@qbs-autonaim/db/schema";
import { encryptApiKeys, getEncryptionKey } from "@qbs-autonaim/server-utils";
import { tgClientSDK } from "@qbs-autonaim/tg-client/sdk";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { verifyWorkspaceAccess } from "../../../utils/verify-workspace-access";
import { normalizePhone } from "../utils";

export const checkPasswordRouter = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      apiId: z.number(),
      apiHash: z.string(),
      phone: z.string().trim(),
      password: z.string(),
      sessionData: z.string(),
    }),
  )
  .handler(async ({ input, context }) => {
    await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.workspaceId,
      context.session.user.id,
    );

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
      const result = await tgClientSDK.checkPassword({
        apiId: input.apiId,
        apiHash: input.apiHash,
        phone,
        password: input.password,
        sessionData: input.sessionData,
      });

      const sessionDataObj = JSON.parse(result.sessionData);
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
      if (error instanceof ORPCError) {
        throw error;
      }
      console.error("Ошибка проверки пароля:", error);
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Внутренняя ошибка сервера",
        cause: error,
      });
    }
  });
