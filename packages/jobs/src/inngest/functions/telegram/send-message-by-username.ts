import { eq, interviewMessage, telegramSession } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { tgClientSDK } from "@qbs-autonaim/tg-client/sdk";
import { inngest } from "../../client";

/**
 * Inngest функция для отправки сообщения по username
 * Работает с username и messageId для обновления статуса в БД
 */
export const sendTelegramMessageByUsernameFunction = inngest.createFunction(
  {
    id: "send-telegram-message-by-username",
    name: "Send Telegram Message By Username",
    retries: 0,
  },
  { event: "telegram/message.send.by-username" },
  async ({ event, step }) => {
    const { messageId, username, content, workspaceId } = event.data;

    // Задержка 3-5 минут для имитации живого человека
    const delayMinutes = Math.floor(Math.random() * 3) + 3;
    console.log(delayMinutes);
    //await step.sleep("human-delay", `${delayMinutes}m`);

    const result = await step.run("send-telegram-message", async () => {
      console.log("📤 Отправка сообщения по username", {
        username,
        workspaceId,
      });

      try {
        // Получаем активную сессию для конкретного workspace
        const session = await db.query.telegramSession.findFirst({
          where: (sessions, { eq, and }) =>
            and(
              eq(sessions.isActive, true),
              eq(sessions.workspaceId, workspaceId),
            ),
          orderBy: (sessions, { desc }) => [desc(sessions.lastUsedAt)],
        });

        if (!session) {
          throw new Error(
            `Нет активной Telegram сессии для workspace ${workspaceId}`,
          );
        }

        // Отправляем сообщение по username
        console.log(`📨 Отправка по username: @${username}`);
        const result = await tgClientSDK.sendMessageByUsername({
          workspaceId,
          username,
          text: content,
        });

        // Обновляем lastUsedAt для сессии
        await db
          .update(telegramSession)
          .set({ lastUsedAt: new Date() })
          .where(eq(telegramSession.id, session.id));

        // Обновляем externalId в БД, если messageId не пустой и не временный
        if (messageId && !messageId.startsWith("temp_")) {
          await db
            .update(interviewMessage)
            .set({ externalId: result.messageId })
            .where(eq(interviewMessage.id, messageId));
        } else if (messageId?.startsWith("temp_")) {
          console.log("⏭️ Пропущен апдейт: временный messageId", {
            messageId,
            externalId: result.messageId,
          });
        }

        console.log("✅ Сообщение отправлено по username", {
          username,
          externalMessageId: result.messageId,
          sessionId: session.id,
          dbMessageId: messageId,
        });

        return {
          success: true,
          chatMessageId: result.messageId,
          chatId: result.chatId,
        };
      } catch (error) {
        console.error("❌ Ошибка отправки сообщения по username", {
          username,
          error,
        });
        throw error;
      }
    });

    return {
      success: true,
      username,
      chatMessageId: result.chatMessageId,
      chatId: result.chatId,
    };
  },
);
