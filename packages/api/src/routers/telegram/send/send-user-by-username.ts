import { eq, telegramSession } from "@qbs-autonaim/db";
import { tgClientSDK } from "@qbs-autonaim/tg-client/sdk";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const sendUserMessageRouter = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      sessionId: z.string().optional(),
      username: z.string(),
      text: z.string().min(1),
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
        throw new ORPCError("NOT_FOUND", { message: "Telegram сессия не найдена. Пожалуйста, авторизуйтесь.", });
      }

      const result = await tgClientSDK.sendMessageByUsername({
        workspaceId: input.workspaceId,
        username: input.username,
        text: input.text,
      });

      await context.db
        .update(telegramSession)
        .set({ lastUsedAt: new Date() })
        .where(eq(telegramSession.id, session.id));

      return result;
    } catch (error) {
      console.error("❌ Ошибка отправки сообщения:", error);
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error instanceof Error
            ? error.message
            : "Не удалось отправить сообщение", });
    }
  });
