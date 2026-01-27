import { generateWelcomeMessage } from "../../../../services/messaging";
import { inngest } from "../../../client";
import { fetchResponseData } from "./data-fetchers";
import {
  sendHHWelcome,
  sendTelegramWelcome,
  sendWebChatInvite,
} from "./message-senders";
import { saveInterviewSession, updateWelcomeSent } from "./session-managers";
import type { SendResult } from "./types";

/**
 * Inngest функция для отправки приветственного сообщения кандидату
 * Маршрутизирует приветствие в настроенные каналы общения вакансии:
 * - Telegram: если включен и есть активная сессия
 * - Веб-чат: если включен (работает независимо от Telegram)
 * - HH.ru чат: если ничего не включено и источник - HH.ru
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
      return fetchResponseData(responseId);
    });

    // Получаем настройки каналов общения из вакансии
    const enabledChannels = responseData.vacancy
      .enabledCommunicationChannels || {
      webChat: true,
      telegram: false,
    };

    let sendResult: SendResult | null = null;

    // Для всех источников (HH и других) используем настроенные каналы общения вакансии
    if (enabledChannels.telegram) {
      // Отправляем приветствие в Telegram
      const welcomeMessage = await step.run(
        "generate-welcome-message",
        async () => {
          console.log("🤖 Генерация приветственного сообщения для Telegram", {
            responseId,
            username,
            source: responseData.importSource,
          });

          const result = await generateWelcomeMessage(responseId, "telegram");

          if (!result.success) {
            throw new Error(result.error);
          }

          console.log("✅ Сообщение сгенерировано", {
            responseId,
            messageLength: result.data.length,
          });

          return result.data;
        },
      );

      try {
        sendResult = await step.run("send-telegram-welcome", async () => {
          return sendTelegramWelcome(
            responseData,
            username,
            phone,
            welcomeMessage,
          );
        });
      } catch (error) {
        console.log(
          `⚠️ Не удалось отправить приветствие в Telegram: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        return {
          success: false,
          error: `Telegram welcome failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    } else if (enabledChannels.webChat) {
      // Отправляем приглашение в веб-чат
      const webChatMessage = await step.run(
        "generate-webchat-message",
        async () => {
          console.log("🤖 Генерация приглашения в веб-чат", {
            responseId,
            username,
            source: responseData.importSource,
          });

          const result = await generateWelcomeMessage(responseId, "web");

          if (!result.success) {
            throw new Error(result.error);
          }

          console.log("✅ Сообщение сгенерировано", {
            responseId,
            messageLength: result.data.length,
          });

          return result.data;
        },
      );

      try {
        sendResult = await step.run("send-webchat-invite", async () => {
          return sendWebChatInvite(
            responseData,
            username,
            phone,
            webChatMessage,
          );
        });
      } catch (error) {
        console.log(
          `⚠️ Не удалось отправить приглашение в веб-чат: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        return {
          success: false,
          error: `WebChat invite failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    } else {
      // Если ничего не включено, отправляем в HH.ru (если это HH источник) или возвращаем ошибку
      if (responseData.importSource === "HH") {
        const welcomeMessage = await step.run(
          "generate-welcome-message",
          async () => {
            console.log(
              "🤖 Генерация приветственного сообщения для HH.ru (ничего не настроено)",
              {
                responseId,
                username,
              },
            );

            const result = await generateWelcomeMessage(responseId, "hh");

            if (!result.success) {
              throw new Error(result.error);
            }

            console.log("✅ Сообщение сгенерировано", {
              responseId,
              messageLength: result.data.length,
            });

            return result.data;
          },
        );

        sendResult = await step.run("send-hh-welcome", async () => {
          return sendHHWelcome(responseData, welcomeMessage);
        });
      } else {
        // Для других источников, если ничего не настроено
        console.log(
          `📋 Нет включенных каналов общения для вакансии ${responseData.vacancy.id}`,
        );
        return { success: false, error: "No communication channels enabled" };
      }
    }

    // Если получили chatId, сохраняем/обновляем interviewSession
    if (sendResult?.chatId) {
      await step.run("save-interview-session", async () => {
        return saveInterviewSession(
          responseId,
          sendResult.chatId,
          sendResult.channel,
          sendResult.sentMessage,
          username,
        );
      });

      // Обновляем welcomeSentAt только после успешной отправки
      await step.run("update-welcome-sent", async () => {
        return updateWelcomeSent(responseId, sendResult.chatId);
      });

      return {
        success: true,
        chatId: sendResult.chatId,
        messageId: sendResult.messageId,
      };
    }

    return { success: false, error: "No chatId received" };
  },
);
