import { eq } from "@qbs-autonaim/db";
import { telegramSession } from "@qbs-autonaim/db/schema";
import { tgClientSDK } from "@qbs-autonaim/tg-client/sdk";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";
import { normalizePhone } from "../utils";

export const checkPasswordRouter = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      apiId: z.number(),
      apiHash: z.string(),
      phone: z.string().trim(),
      password: z.string(),
      sessionData: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    try {
      const existingSession = await ctx.db.query.telegramSession.findFirst({
        where: eq(telegramSession.workspaceId, input.workspaceId),
      });

      if (existingSession) {
        throw new TRPCError({
          code: "CONFLICT",
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
      const [session] = await ctx.db
        .insert(telegramSession)
        .values({
          workspaceId: input.workspaceId,
          apiId: input.apiId.toString(),
          apiHash: input.apiHash,
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
      console.error("Ошибка проверки пароля:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Неверный пароль",
      });
    }
  });
