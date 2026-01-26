import { env } from "@qbs-autonaim/config";
import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  interviewMessage,
  interviewSession,
  response,
  telegramSession,
} from "@qbs-autonaim/db/schema";
import { logResponseEvent, removeNullBytes } from "@qbs-autonaim/lib";
import { tgClientSDK } from "@qbs-autonaim/tg-client/sdk";
import {
  generateTelegramInvite,
  generateTelegramInviteMessage,
  generateWelcomeMessage,
  sendHHChatMessage,
} from "../../../services/messaging";
import { inngest } from "../../client";

/**
 * Inngest функция для отправки приветственного сообщения кандидату
 * Маршрутизирует отправку по источнику отклика:
 * - HH: отправляет в HH.ru
 * - TELEGRAM: отправляет в Telegram
 * - Другие: пропускает
 */
export const sendCandidateWelcomeFunction = inngest.createFunction(
  {
    id: "send-candidate-welcome",
    name: "Send Candidate Welcome Message",
    retries: 3,
  },
  { event: "candidate/welcome" },
  async ({ event, step }) => {
    const { responseId, username, phone } = event.data;

    // Получаем данные отклика
    const responseData = await step.run("fetch-response-data", async () => {
      const result = await db.query.response.findFirst({
        where: eq(response.id, responseId),
      });

      if (!result) {
        throw new Error(`Отклик не найден: ${responseId}`);
      }

      // Получаем vacancy отдельно через entityId
      const vacancy = await db.query.vacancy.findFirst({
        where: (v, { eq }) => eq(v.id, result.entityId),
      });

      if (!vacancy) {
        throw new Error(`Вакансия не найдена для отклика: ${responseId}`);
      }

      return { ...result, vacancy };
    });

    const welcomeMessage = await step.run(
      "generate-welcome-message",
      async () => {
        console.log("🤖 Генерация приветственного сообщения", {
          responseId,
          username,
        });

        try {
          const result = await generateWelcomeMessage(responseId);

          if (!result.success) {
            throw new Error(result.error);
          }

          const message = result.data;

          console.log("✅ Сообщение сгенерировано", {
            responseId,
            messageLength: message.length,
          });

          return message;
        } catch (error) {
          console.error("❌ Ошибка генерации приветствия", {
            responseId,
            error,
          });
          throw error;
        }
      },
    );

    const result = await step.run("send-welcome-message", async () => {
      console.log("📤 Отправка приветственного сообщения", {
        responseId,
        importSource: responseData.importSource,
        username,
        phone,
      });

      try {
        const workspaceId = responseData.vacancy.workspaceId;
        const importSource = responseData.importSource || "MANUAL";

        let sendResult: {
          success: boolean;
          messageId: string;
          chatId: string;
          senderId?: string;
          channel: "TELEGRAM" | "HH";
          sentMessage: string;
        } | null = null;

        // Маршрутизация по источнику отклика
        if (importSource === "HH") {
          // Отправляем только в HH.ru
          console.log(`📧 Отправка приветствия в HH.ru (источник: ${importSource})`);

          // Проверяем наличие chatId для HH
          if (!responseData.chatId) {
            console.log(`⚠️ chatId не найден для HH отклика ${responseId}, пропускаем отправку`);
            throw new Error(`chatId не найден для HH отклика, невозможно отправить приветствие`);
          }

          const inviteMessageResult = await generateTelegramInviteMessage(responseId);
          const messageWithInvite = inviteMessageResult.success
            ? inviteMessageResult.data
            : welcomeMessage;

          const hhResult = await sendHHChatMessage({
            workspaceId,
            responseId,
            text: messageWithInvite,
          });

          if (hhResult.success) {
            console.log(`✅ Приветствие отправлено в HH.ru`);
            sendResult = {
              success: true,
              messageId: "",
              chatId: responseData.chatId,
              channel: "HH" as const,
              sentMessage: messageWithInvite,
            };
          } else {
            console.error(`❌ Не удалось отправить в HH.ru: ${hhResult.error}`);
            throw new Error(`Не удалось отправить приветствие в HH.ru: ${hhResult.error}`);
          }

        } else if (importSource === "TELEGRAM") {
          // Отправляем только в Telegram
          console.log(`📱 Отправка приветствия в Telegram (источник: ${importSource})`);

          // Получаем активную сессию для workspace
          const session = await db.query.telegramSession.findFirst({
            where: eq(telegramSession.workspaceId, workspaceId),
            orderBy: (sessions, { desc }) => [desc(sessions.lastUsedAt)],
          });

          if (!session) {
            throw new Error(`Нет активной Telegram сессии для workspace ${workspaceId}`);
          }

          // Пытаемся отправить по username
          if (username) {
            console.log(`📨 Попытка отправки по username: @${username}`);
            try {
              const tgResult = await tgClientSDK.sendMessageByUsername({
                workspaceId,
                username,
                text: welcomeMessage,
              });

              if (tgResult) {
                console.log("✅ Приветствие отправлено по username", {
                  responseId,
                  username,
                  chatId: tgResult.chatId,
                });

                await db
                  .update(telegramSession)
                  .set({ lastUsedAt: new Date() })
                  .where(eq(telegramSession.id, session.id));

                sendResult = {
                  ...tgResult,
                  channel: "TELEGRAM" as const,
                  sentMessage: welcomeMessage,
                };
              }
            } catch (error) {
              console.log(`⚠️ Не удалось отправить по username: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
          }

          // Если username не сработал, пробуем по телефону
          if (!sendResult && phone) {
            console.log(`📞 Попытка отправки по номеру телефона: ${phone}`);
            try {
              const tgResult = await tgClientSDK.sendMessageByPhone({
                workspaceId,
                phone,
                text: welcomeMessage,
                firstName: responseData.candidateName || undefined,
              });

              if (tgResult) {
                console.log("✅ Приветствие отправлено по номеру телефона", {
                  responseId,
                  phone,
                  chatId: tgResult.chatId,
                });

                await db
                  .update(telegramSession)
                  .set({ lastUsedAt: new Date() })
                  .where(eq(telegramSession.id, session.id));

                sendResult = {
                  ...tgResult,
                  channel: "TELEGRAM" as const,
                  sentMessage: welcomeMessage,
                };
              }
            } catch (error) {
              console.log(`⚠️ Не удалось отправить по телефону: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
          }

          if (!sendResult) {
            throw new Error(
              username && phone
                ? `Не удалось отправить приветствие ни по username (@${username}), ни по телефону (${phone})`
                : username
                  ? `Не удалось отправить приветствие по username (@${username}), телефон не указан`
                  : phone
                    ? `Username не указан, не удалось отправить по телефону (${phone})`
                    : "Не указаны ни username, ни телефон для отправки приветствия"
            );
          }

        } else {
          // Для других источников (WEB_LINK, MANUAL, etc.) отправляем в Telegram или пропускаем
          console.log(`📋 Пропуск отправки приветствия (источник: ${importSource}) - не поддерживается`);
          throw new Error(`Отправка приветствия не поддерживается для источника: ${importSource}`);
        }

        return sendResult;
      } catch (error) {
        console.error("❌ Ошибка отправки приветственного сообщения", {
          responseId,
          importSource: responseData.importSource,
          username,
          phone,
          error,
        });
        throw error;
      }
    });

    // Если получили chatId, сохраняем/обновляем interviewSession
    if (result?.chatId) {
      const chatId = result.chatId;
      await step.run("save-interview-session", async () => {
        // Проверяем, есть ли уже interviewSession для этого response
        const existing = await db.query.interviewSession.findFirst({
          where: eq(interviewSession.responseId, responseId),
        });

        if (existing) {
          // Получаем существующие метаданные
          const existingMetadata = existing.metadata || {};

          // Объединяем с новыми данными
          const updatedMetadata = {
            ...existingMetadata,
            telegramUsername: username,
            telegramChatId: chatId,
            questionAnswers: existingMetadata.questionAnswers || [],
          };

          // Обновляем существующую interviewSession
          await db
            .update(interviewSession)
            .set({
              status: "active",
              lastChannel: result.channel === "TELEGRAM" ? "telegram" : "web",
              metadata: updatedMetadata,
            })
            .where(eq(interviewSession.id, existing.id));
        } else {
          // Создаем новую interviewSession
          const newMetadata = {
            telegramUsername: username,
            telegramChatId: chatId,
            questionAnswers: [],
          };

          await db.insert(interviewSession).values({
            responseId: responseId,
            status: "active",
            lastChannel: result.channel === "TELEGRAM" ? "telegram" : "web",
            metadata: newMetadata,
          });
        }

        const session = await db.query.interviewSession.findFirst({
          where: eq(interviewSession.responseId, responseId),
        });

        if (!session) {
          throw new Error("Failed to create/update interviewSession");
        }

        // Сохраняем приветственное сообщение с правильным каналом и текстом
        await db.insert(interviewMessage).values({
          sessionId: session.id,
          role: "assistant",
          type: "text",
          channel: result.channel === "TELEGRAM" ? "telegram" : "web",
          content: removeNullBytes(result.sentMessage),
          externalId: result.messageId,
        });

        return session;
      });

      // Обновляем welcomeSentAt только после успешной отправки
      await step.run("update-welcome-sent", async () => {
        await db
          .update(response)
          .set({ welcomeSentAt: new Date() })
          .where(eq(response.id, responseId));

        await logResponseEvent({
          db,
          responseId,
          eventType: "WELCOME_SENT",
          metadata: { chatId: result.chatId },
        });
      });

      return {
        success: true,
        chatId: result.chatId,
        messageId: result.messageId,
      };
    }

    return { success: false, error: "No chatId received" };
  },
);
