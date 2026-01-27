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
 * Отправляет приветствие туда, откуда пришел отклик:
 * - HH: всегда отправляет в HH.ru с информацией о доступных каналах продолжения интервью
 *   (Telegram, веб-чат или продолжение в HH.ru чате - зависит от настроек вакансии)
 * - Другие источники: отправляет в настроенные каналы общения вакансии
 *   (Telegram и веб-чат требуют активной Telegram сессии для отправки сообщений)
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

    if (responseData.importSource === "HH") {
      // Всегда отправляем приветствие в HH.ru с информацией о доступных каналах продолжения
      const welcomeMessage = await step.run(
        "generate-welcome-message",
        async () => {
          console.log(
            "🤖 Генерация приветственного сообщения для HH с вариантами продолжения",
            {
              responseId,
              username,
              enabledChannels,
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
      // Для откликов из других источников используем настроенные каналы общения вакансии
      if (enabledChannels.telegram) {
        // Отправляем приветствие в Telegram
        const welcomeMessage = await step.run(
          "generate-welcome-message",
          async () => {
            console.log("🤖 Генерация приветственного сообщения для Telegram", {
              responseId,
              username,
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

        sendResult = await step.run("send-telegram-welcome", async () => {
          return sendTelegramWelcome(
            responseData,
            username,
            phone,
            welcomeMessage,
          );
        });
      } else if (enabledChannels.webChat) {
        // Отправляем приглашение в веб-чат через Telegram
        const webChatMessage = await step.run(
          "generate-webchat-message",
          async () => {
            console.log("🤖 Генерация приветственного сообщения для веб-чата", {
              responseId,
              username,
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

        sendResult = await step.run("send-webchat-invite", async () => {
          return sendWebChatInvite(
            responseData,
            username,
            phone,
            webChatMessage,
          );
        });
      } else {
        // Нет включенных каналов общения
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
