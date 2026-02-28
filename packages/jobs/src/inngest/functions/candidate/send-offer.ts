import { eq, logResponseEvent, logResponseInteraction } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  type InterviewChannel,
  interviewMessage,
  interviewSession,
  response,
} from "@qbs-autonaim/db/schema";
import { removeNullBytes } from "@qbs-autonaim/lib";
import { tgClientSDK } from "@qbs-autonaim/tg-client/sdk";
import { inngest } from "../../client";

export const sendOfferFunction = inngest.createFunction(
  {
    id: "candidate-send-offer",
    name: "Отправка оффера кандидату",
    retries: 3,
  },
  { event: "candidate/offer.send" },
  async ({ event, step }) => {
    const { responseId, workspaceId, offerDetails } = event.data;

    const responseData = await step.run("fetch-response-data", async () => {
      const result = await db.query.response.findFirst({
        where: eq(response.id, responseId),
      });

      if (!result) {
        throw new Error(`Отклик не найден: ${responseId}`);
      }

      return result;
    });

    // Проверяем, есть ли interviewSession для этого кандидата
    const session = await step.run("fetch-interview-session", async () => {
      return await db.query.interviewSession.findFirst({
        where: eq(interviewSession.responseId, responseId),
      });
    });

    if (!session) {
      console.log("У кандидата нет активной беседы, пропускаем отправку");
      return { success: false, reason: "no_interview_session" };
    }

    const offerMessage = await step.run("generate-offer-message", async () => {
      return `🎉 Поздравляем! Мы готовы сделать вам предложение о работе!

📋 Детали предложения:
• Должность: ${offerDetails.position}
• Зарплата: ${offerDetails.salary}
• Дата начала: ${offerDetails.startDate}
${offerDetails.benefits ? `• Бенефиты: ${offerDetails.benefits}` : ""}

${offerDetails.message ? `\n${offerDetails.message}\n` : ""}
Пожалуйста, подтвердите получение этого предложения и сообщите нам о вашем решении.`;
    });

    const result = await step.run("send-telegram-message", async () => {
      try {
        // Отправляем сообщение через SDK
        const tgResult = await tgClientSDK.sendMessage({
          workspaceId,
          chatId: Number(responseData.chatId),
          text: offerMessage,
        });

        if (tgResult) {
          console.log("✅ Оффер отправлен", {
            responseId,
            chatId: tgResult.chatId,
          });

          return {
            success: true,
            messageId: tgResult.messageId,
            chatId: tgResult.chatId,
          };
        }

        throw new Error("Не удалось отправить сообщение");
      } catch (error) {
        console.error("❌ Ошибка отправки оффера", {
          responseId,
          error,
        });
        throw error;
      }
    });

    // Сохраняем сообщение в базу
    await step.run("save-message", async () => {
      await db.insert(interviewMessage).values({
        sessionId: session.id,
        role: "assistant",
        type: "text",
        channel: (session.lastChannel ?? "telegram") as InterviewChannel,
        content: removeNullBytes(offerMessage),
        externalId: result.messageId,
      });
    });

    // Логируем событие
    await step.run("log-event", async () => {
      await logResponseEvent({
        db,
        responseId,
        eventType: "OFFER_SENT",
        metadata: { offerDetails },
      });
    });

    await step.run("log-interaction", async () => {
      try {
        await logResponseInteraction({
          db,
          responseId,
          interactionType: "offer_sent",
          source: "auto",
          channel: "telegram",
        });
      } catch (err) {
        console.error(
          "[send-offer] Ошибка логирования взаимодействия:",
          { responseId, interactionType: "offer_sent" },
          err,
        );
      }
    });

    return { success: true, responseId, messageId: result.messageId };
  },
);
