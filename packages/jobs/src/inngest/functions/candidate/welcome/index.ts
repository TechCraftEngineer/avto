import { InterviewLinkGenerator } from "@qbs-autonaim/shared/server";
import { generateWelcomeMessage } from "../../../../services/messaging";
import { isHHAuthError } from "../../../../utils/hh-auth-error";
import { workspaceNotificationsChannel } from "../../../channels/client";
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
 *
 * Логика маршрутизации:
 *
 * Для откликов из HH.ru (importSource === "HH"):
 * 1. Всегда отправляем сообщение в HH.ru чат
 * 2. Содержание сообщения зависит от включенных каналов:
 *    - Если включен Telegram: отправляем приглашение перейти в Telegram
 *    - Если включен веб-чат: отправляем ссылку на веб-чат
 *    - Если ничего не включено: отправляем обычное приветствие
 *
 * Для откликов из других источников:
 * - Telegram: если включен и есть активная сессия
 * - Веб-чат: если включен (работает независимо от Telegram)
 */
export const sendCandidateWelcomeFunction = inngest.createFunction(
  {
    id: "send-candidate-welcome",
    name: "Send Candidate Welcome Message",
    retries: 3,
  },
  { event: "candidate/welcome" },
  async ({ event, step, publish }) => {
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

    // Для откликов из HH.ru всегда отправляем сообщение в HH.ru чат
    if (responseData.importSource === "HH") {
      try {
        // Генерируем сообщение в зависимости от включенных каналов
        let hhMessage: string;

        if (enabledChannels.telegram) {
          // Генерируем приглашение в Telegram
          hhMessage = await step.run(
            "generate-hh-telegram-invite",
            async () => {
              console.log("🤖 Генерация приглашения в Telegram для HH.ru", {
                responseId,
                username,
              });

              const result = await generateWelcomeMessage(
                responseId,
                "hh-telegram-invite",
              );

              if (!result.success) {
                throw new Error(result.error);
              }

              console.log("✅ Приглашение в Telegram сгенерировано", {
                responseId,
                messageLength: result.data.length,
              });

              return result.data;
            },
          );
        } else if (enabledChannels.webChat) {
          // Генерируем уникальную ссылку на веб-чат для этого отклика
          const interviewLink = await step.run(
            "generate-interview-link",
            async () => {
              const linkGenerator = new InterviewLinkGenerator();
              return linkGenerator.getOrCreateResponseInterviewLink(
                responseId,
                responseData.vacancy.workspaceId,
              );
            },
          );

          hhMessage = await step.run("generate-hh-webchat-invite", async () => {
            console.log("🤖 Генерация приглашения в веб-чат для HH.ru", {
              responseId,
              username,
            });

            const result = await generateWelcomeMessage(
              responseId,
              "hh-webchat-invite",
              interviewLink.url,
            );

            if (!result.success) {
              throw new Error(result.error);
            }

            console.log("✅ Приглашение в веб-чат сгенерировано", {
              responseId,
              messageLength: result.data.length,
            });

            return result.data;
          });
        } else {
          // Если ничего не включено, отправляем сообщение без ссылки на интервью
          hhMessage = await step.run("generate-hh-message", async () => {
            console.log("🤖 Генерация сообщения для HH.ru", {
              responseId,
              username,
            });

            const result = await generateWelcomeMessage(responseId, "hh");

            if (!result.success) {
              throw new Error(result.error);
            }

            console.log("✅ Сообщение сгенерировано", {
              responseId,
              messageLength: result.data.length,
            });

            return result.data;
          });
        }

        // Отправляем сообщение в HH.ru чат
        const hhResult = await step.run("send-hh-message", async () => {
          return sendHHWelcome(responseData, hhMessage);
        });

        sendResults.push(hhResult);
      } catch (error) {
        const errorMessage = `HH message failed: ${error instanceof Error ? error.message : "Unknown error"}`;
        console.log(`⚠️ ${errorMessage}`);
        errors.push(errorMessage);
        if (isHHAuthError(error)) {
          await publish(
            workspaceNotificationsChannel(responseData.vacancy.workspaceId)[
              "integration-error"
            ]({
              workspaceId: responseData.vacancy.workspaceId,
              type: "hh-auth-failed",
              message:
                "Авторизация в HeadHunter слетела. Проверьте учётные данные в настройках интеграции.",
              severity: "error",
              timestamp: new Date().toISOString(),
            }),
          );
        }
      }
    } else {
      // Для других источников (не HH.ru) используем прямую отправку в каналы

      // Отправка в Telegram если включен
      if (enabledChannels.telegram) {
        try {
          const welcomeMessage = await step.run(
            "generate-telegram-message",
            async () => {
              console.log(
                "🤖 Генерация приветственного сообщения для Telegram",
                {
                  responseId,
                  username,
                  source: responseData.importSource,
                },
              );

              const result = await generateWelcomeMessage(
                responseId,
                "telegram",
              );

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

          const telegramResult = await step.run(
            "send-telegram-welcome",
            async () => {
              return sendTelegramWelcome(
                responseData,
                username,
                phone,
                welcomeMessage,
              );
            },
          );

          sendResults.push(telegramResult);
        } catch (error) {
          const errorMessage = `Telegram welcome failed: ${error instanceof Error ? error.message : "Unknown error"}`;
          console.log(`⚠️ ${errorMessage}`);
          errors.push(errorMessage);
        }
      }

      // Отправка в веб-чат если включен
      if (enabledChannels.webChat) {
        try {
          const interviewLink = await step.run(
            "generate-interview-link",
            async () => {
              const linkGenerator = new InterviewLinkGenerator();
              return linkGenerator.getOrCreateResponseInterviewLink(
                responseId,
                responseData.vacancy.workspaceId,
              );
            },
          );

          const webChatMessage = await step.run(
            "generate-webchat-message",
            async () => {
              console.log("🤖 Генерация приглашения в веб-чат", {
                responseId,
                username,
                source: responseData.importSource,
              });

              const result = await generateWelcomeMessage(
                responseId,
                "web",
                interviewLink.url,
              );

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

          const webChatResult = await step.run(
            "send-webchat-invite",
            async () => {
              return sendWebChatInvite(
                responseData,
                username,
                phone,
                webChatMessage,
              );
            },
          );

          sendResults.push(webChatResult);
        } catch (error) {
          const errorMessage = `WebChat invite failed: ${error instanceof Error ? error.message : "Unknown error"}`;
          console.log(`⚠️ ${errorMessage}`);
          errors.push(errorMessage);
        }
      }

      // Если ничего не включено для не-HH источников
      if (!enabledChannels.telegram && !enabledChannels.webChat) {
        console.log(
          `📋 Нет включенных каналов общения для вакансии ${responseData.vacancy.id}`,
        );
        return { success: false, error: "No communication channels enabled" };
      }
    }

    // If we have any successful sends, process them
    if (sendResults.length > 0) {
      // Use the first successful result for session management
      const firstSuccessfulResult = sendResults[0] as SendResult; // We know sendResults.length > 0

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
        return updateWelcomeSent(
          responseId,
          firstSuccessfulResult.chatId,
          firstSuccessfulResult.channel,
        );
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
