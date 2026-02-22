import { ORPCError } from "@orpc/server";
import { eq, telegramSession } from "@qbs-autonaim/db";
import { tgClientSDK } from "@qbs-autonaim/tg-client/sdk";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const sendUserMessageByPhoneRouter = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      sessionId: z.string().optional(),
      phone: z.string(),
      text: z.string().min(1),
      firstName: z.string().optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    try {
      const session = input.sessionId
        ? await context.db.query.telegramSession.findFirst({
            where: eq(telegramSession.id, input.sessionId),
          })
        : await context.db.query.telegramSession.findFirst({
            where: eq(telegramSession.workspaceId, input.workspaceId),
            orderBy: (sessions, { desc }) => [desc(sessions.lastUsedAt)],
          });

      if (!session) {
        throw new ORPCError("NOT_FOUND", {
          message: "Telegram сессия не найдена. Пожалуйста, авторизуйтесь.",
        });
      }

      const result = await tgClientSDK.sendMessageByPhone({
        workspaceId: input.workspaceId,
        phone: input.phone,
        text: input.text,
        firstName: input.firstName,
      });

      await context.db
        .update(telegramSession)
        .set({ lastUsedAt: new Date() })
        .where(eq(telegramSession.id, session.id));

      return result;
    } catch (error) {
      console.error("❌ Ошибка отправки сообщения по телефону:", error);
      if (error instanceof ORPCError) throw error;
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message:
          error instanceof Error
            ? error.message
            : "Не удалось отправить сообщение",
      });
    }
  });
