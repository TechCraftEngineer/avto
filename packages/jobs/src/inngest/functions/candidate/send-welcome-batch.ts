import { env } from "@qbs-autonaim/config";
import { eq, inArray } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  interviewMessage,
  interviewSession,
  response,
  telegramSession,
} from "@qbs-autonaim/db/schema";
import { removeNullBytes } from "@qbs-autonaim/lib";
import { tgClientSDK } from "@qbs-autonaim/tg-client/sdk";
import {
  generateTelegramInvite,
  generateTelegramInviteMessage,
  generateWelcomeMessage,
  sendHHChatMessage,
} from "../../../services/messaging";
import { isHHAuthError } from "../../../utils/hh-auth-error";
import { workspaceNotificationsChannel } from "../../channels/client";
import { inngest } from "../../client";

/**
 * Inngest функция для массовой отправки приветственных сообщений кандидатам
 * Использует batch events для эффективной обработки множества откликов
 */
export const sendCandidateWelcomeBatchFunction = inngest.createFunction(
  {
    id: "send-candidate-welcome-batch",
    name: "Send Candidate Welcome Messages (Batch)",
    batchEvents: {
      maxSize: 4,
      timeout: "10s",
    },
  },
  { event: "candidate/welcome.batch" },
  async ({ events, step, publish }) => {
    console.log(
      `🚀 Запуск массовой отправки приветствий для ${events.length} событий`,
    );

    // Собираем все responseIds из всех событий
    const allResponseIds = events.flatMap((evt) => evt.data.responseIds);

    console.log(`📋 Всего откликов для обработки: ${allResponseIds.length}`);

    // Получаем данные откликов с username или телефоном
    const responses = await step.run("fetch-responses", async () => {
      const results = await db
        .select({
          id: response.id,
          telegramUsername: response.telegramUsername,
          phone: response.phone,
          candidateName: response.candidateName,
          entityId: response.entityId,
          chatId: response.chatId,
          entityType: response.entityType,
        })
        .from(response)
        .where(inArray(response.id, allResponseIds));

      console.log(`✅ Найдено откликов в БД: ${results.length}`);
      return results;
    });

    // Фильтруем отклики с username или телефоном
    const responsesWithContact = responses.filter(
      (r) => r.telegramUsername || r.phone,
    );
    const skippedCount = responses.length - responsesWithContact.length;

    console.log(
      `📤 Отклики с контактами: ${responsesWithContact.length}, пропущено: ${skippedCount}`,
    );

    // Обрабатываем каждый отклик
    const results = await Promise.allSettled(
      responsesWithContact.map(async (responseItem) => {
        return await step.run(`send-welcome-${responseItem.id}`, async () => {
          try {
            // Получаем workspace через entityId (vacancyId)
            const vacancy = await db.query.vacancy.findFirst({
              where: (v, { eq }) => eq(v.id, responseItem.entityId),
              columns: {
                workspaceId: true,
                enabledCommunicationChannels: true,
              },
            });

            if (!vacancy) {
              throw new Error(
                `Вакансия не найдена для отклика ${responseItem.id}`,
              );
            }

            const workspaceId = vacancy.workspaceId;
            const session = await db.query.telegramSession.findFirst({
              where: eq(telegramSession.workspaceId, workspaceId),
              orderBy: (sessions, { desc }) => [desc(sessions.lastUsedAt)],
            });

            if (!session) {
              throw new Error(
                `Нет активной Telegram сессии для workspace ${workspaceId}`,
              );
            }

            // Определяем канал на основе настроек вакансии
            const enabledChannels = vacancy.enabledCommunicationChannels || {
              webChat: true,
              telegram: false,
            };
            const channel = enabledChannels.telegram ? "telegram" : "web-chat";

            // Генерируем приветственное сообщение
            const welcomeResult = await generateWelcomeMessage(
              responseItem.id,
              channel,
            );
            if (!welcomeResult.success) {
              throw new Error(welcomeResult.error);
            }
            const welcomeMessage = welcomeResult.data;

            let sendResult: {
              success: boolean;
              messageId: string;
              chatId: string;
            } | null = null;

            let actualSentMessage = welcomeMessage;

            // Пытаемся отправить по username, если он есть
            if (responseItem.telegramUsername) {
              console.log(
                `📨 Попытка отправки по username: @${responseItem.telegramUsername}`,
              );
              try {
                sendResult = await tgClientSDK.sendMessageByUsername({
                  workspaceId,
                  username: responseItem.telegramUsername,
                  text: welcomeMessage,
                });
              } catch (_error) {
                if (responseItem.phone) {
                  console.log(
                    `⚠️ Не удалось отправить по username, пробуем по телефону`,
                  );
                }
              }
            }

            // Если username не сработал или его нет, пробуем по телефону
            if (!sendResult && responseItem.phone) {
              console.log(
                `📞 Попытка отправки по номеру телефона: ${responseItem.phone}`,
              );
              sendResult = await tgClientSDK.sendMessageByPhone({
                workspaceId,
                phone: responseItem.phone,
                text: welcomeMessage,
                firstName: responseItem.candidateName || undefined,
              });
            }

            // Если не удалось отправить через Telegram, пробуем через hh.ru
            if (!sendResult) {
              console.log(`📧 Попытка отправки через hh.ru`);

              // Generate PIN code first
              const pinCodeResult = await generateTelegramInvite({
                responseId: responseItem.id,
                botUsername: "", // Not needed anymore
              });

              const inviteMessageResult = await generateTelegramInviteMessage(
                responseItem.id,
              );

              let messageWithInvite = inviteMessageResult.success
                ? inviteMessageResult.data
                : welcomeMessage;

              // Get telegram username from session userInfo
              const userInfo = session.userInfo as {
                username?: string;
              } | null;
              const telegramUsername =
                userInfo?.username || env.TELEGRAM_BOT_USERNAME;

              if (telegramUsername && pinCodeResult.success) {
                messageWithInvite = `${messageWithInvite}\n\n📱 Напишите мне в Telegram @${telegramUsername}`;
              }

              actualSentMessage = messageWithInvite;

              const hhResult = await sendHHChatMessage({
                workspaceId,
                responseId: responseItem.id,
                text: messageWithInvite,
              });

              if (hhResult.success) {
                console.log(`✅ Сообщение отправлено через hh.ru`);

                // Обновляем статус отправки приветствия
                await db
                  .update(response)
                  .set({
                    welcomeSentAt: new Date(),
                  })
                  .where(eq(response.id, responseItem.id));

                return {
                  responseId: responseItem.id,
                  username: responseItem.telegramUsername,
                  chatId: responseItem.chatId || "",
                  success: true,
                  method: "hh",
                  sentMessage: actualSentMessage,
                };
              }

              if (isHHAuthError(new Error(hhResult.error))) {
                await publish(
                  workspaceNotificationsChannel(workspaceId)[
                    "integration-error"
                  ]({
                    workspaceId,
                    type: "hh-auth-failed",
                    message:
                      "Авторизация в HeadHunter слетела. Проверьте учётные данные в настройках интеграции.",
                    severity: "error",
                    timestamp: new Date().toISOString(),
                  }),
                );
              }

              console.error(
                `❌ Не удалось отправить через hh.ru: ${hhResult.error}`,
              );
            }

            if (!sendResult) {
              throw new Error("Не удалось отправить сообщение");
            }

            // Обновляем lastUsedAt для сессии
            await db
              .update(telegramSession)
              .set({ lastUsedAt: new Date() })
              .where(eq(telegramSession.id, session.id));

            // Сохраняем беседу если получили chatId
            if (sendResult.chatId) {
              // Проверяем, есть ли уже interviewSession для этого response
              const existing = await db.query.interviewSession.findFirst({
                where: eq(interviewSession.responseId, responseItem.id),
              });

              let interviewSessionRecord:
                | typeof interviewSession.$inferSelect
                | undefined;
              if (existing) {
                // Получаем существующие метаданные
                const existingMetadata = existing.metadata || {};

                // Объединяем с новыми данными
                const updatedMetadata = {
                  ...existingMetadata,
                  telegramUsername: responseItem.telegramUsername ?? undefined,
                  telegramChatId: sendResult.chatId,
                  questionAnswers: existingMetadata.questionAnswers || [],
                };

                // Обновляем существующую interviewSession
                const [updated] = await db
                  .update(interviewSession)
                  .set({
                    status: "active",
                    lastChannel: "telegram",
                    metadata: updatedMetadata,
                  })
                  .where(eq(interviewSession.id, existing.id))
                  .returning();
                interviewSessionRecord = updated;
              } else {
                // Создаем новую interviewSession
                const newMetadata = {
                  telegramUsername: responseItem.telegramUsername ?? undefined,
                  telegramChatId: sendResult.chatId,
                  questionAnswers: [] as Array<{
                    question: string;
                    answer: string;
                    timestamp?: string;
                  }>,
                };

                const [created] = await db
                  .insert(interviewSession)
                  .values({
                    responseId: responseItem.id,
                    status: "active",
                    lastChannel: "telegram",
                    metadata: newMetadata,
                  })
                  .returning();
                interviewSessionRecord = created;
              }

              // Сохраняем приветственное сообщение в историю
              if (interviewSessionRecord) {
                await db.insert(interviewMessage).values({
                  sessionId: interviewSessionRecord.id,
                  role: "assistant",
                  type: "text",
                  content: removeNullBytes(actualSentMessage),
                  externalId: sendResult.messageId,
                  channel: "telegram",
                });
              }
            }

            // Обновляем статус отправки приветствия
            await db
              .update(response)
              .set({
                welcomeSentAt: new Date(),
              })
              .where(eq(response.id, responseItem.id));

            console.log(
              `✅ Приветствие отправлено: ${responseItem.id} (@${responseItem.telegramUsername})`,
            );

            return {
              responseId: responseItem.id,
              username: responseItem.telegramUsername,
              chatId: sendResult.chatId,
              success: true,
              method: "telegram",
              sentMessage: actualSentMessage,
            };
          } catch (error) {
            console.error(
              `❌ Ошибка отправки приветствия для ${responseItem.id}:`,
              error,
            );
            return {
              responseId: responseItem.id,
              username: responseItem.telegramUsername,
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        });
      }),
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(
      `✅ Завершено: успешно ${successful}, ошибок ${failed}, пропущено ${skippedCount}`,
    );

    return {
      success: true,
      total: allResponseIds.length,
      sent: successful,
      failed,
      skipped: skippedCount,
    };
  },
);
