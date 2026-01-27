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

    const sendResults: SendResult[] = [];
    const errors: string[] = [];

    // Attempt Telegram if enabled
    if (enabledChannels.telegram) {
      try {
        const welcomeMessage = await step.run(
          "generate-telegram-message",
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

        const telegramResult = await step.run("send-telegram-welcome", async () => {
          return sendTelegramWelcome(
            responseData,
            username,
            phone,
            welcomeMessage,
          );
        });

        sendResults.push(telegramResult);
      } catch (error) {
        const errorMessage = `Telegram welcome failed: ${error instanceof Error ? error.message : "Unknown error"}`;
        console.log(`⚠️ ${errorMessage}`);
        errors.push(errorMessage);
      }
    }

    // Attempt WebChat if enabled
    if (enabledChannels.webChat) {
      try {
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

        const webChatResult = await step.run("send-webchat-invite", async () => {
          return sendWebChatInvite(
            responseData,
            username,
            phone,
            webChatMessage,
          );
        });

        sendResults.push(webChatResult);
      } catch (error) {
        const errorMessage = `WebChat invite failed: ${error instanceof Error ? error.message : "Unknown error"}`;
        console.log(`⚠️ ${errorMessage}`);
        errors.push(errorMessage);
      }
    }

    // If no channels were enabled, try HH.ru as fallback for HH sources
    if (!enabledChannels.telegram && !enabledChannels.webChat) {
      if (responseData.importSource === "HH") {
        try {
          const welcomeMessage = await step.run(
            "generate-hh-message",
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

          const hhResult = await step.run("send-hh-welcome", async () => {
            return sendHHWelcome(responseData, welcomeMessage);
          });

          sendResults.push(hhResult);
        } catch (error) {
          const errorMessage = `HH welcome failed: ${error instanceof Error ? error.message : "Unknown error"}`;
          console.log(`⚠️ ${errorMessage}`);
          errors.push(errorMessage);
        }
      } else {
        // Для других источников, если ничего не настроено
        console.log(
          `📋 Нет включенных каналов общения для вакансии ${responseData.vacancy.id}`,
        );
        return { success: false, error: "No communication channels enabled" };
      }
    }

    // If we have any successful sends, process them
    if (sendResults.length > 0) {
      // Use the first successful result for session management
      const firstSuccessfulResult = sendResults[0]!; // We know sendResults.length > 0

      await step.run("save-interview-session", async () => {
        return saveInterviewSession(
          responseId,
          firstSuccessfulResult.chatId,
          firstSuccessfulResult.channel,
          firstSuccessfulResult.sentMessage,
          username,
        );
      });

      // Обновляем welcomeSentAt только после успешной отправки
      await step.run("update-welcome-sent", async () => {
        return updateWelcomeSent(responseId, firstSuccessfulResult.chatId);
      });

      return {
        success: true,
        chatId: firstSuccessfulResult.chatId,
        messageId: firstSuccessfulResult.messageId,
        attemptedChannels: sendResults.length,
        errors: errors.length > 0 ? errors : undefined,
      };
    }

    // If all attempts failed, return combined error
    return {
      success: false,
      error: `All communication channels failed: ${errors.join("; ")}`,
    };
  },
);
