import type { StoredProfileData } from "@qbs-autonaim/db";
import { db, eq } from "@qbs-autonaim/db";
import { response as responseTable } from "@qbs-autonaim/db/schema";
import {
  getInboxTracks,
  type KworkInboxMessage,
  sendMessage as kworkSendMessage,
} from "@qbs-autonaim/integration-clients";
import { generateText } from "@qbs-autonaim/lib/ai";
import { executeWithKworkTokenRefresh } from "../../../services/kwork";
import { inngest } from "../../client";

/**
 * Обработка сообщений Kwork-чата: опрос новых сообщений от фрилансера и ответ AI
 */
export const kworkChatProcessFunction = inngest.createFunction(
  {
    id: "kwork-chat-process",
    name: "Process Kwork Chat Messages",
  },
  { event: "kwork-chat/process" },
  async ({ event, step, publish }) => {
    const { responseId, workspaceId } = event.data;

    const responseData = await step.run("fetch-response", async () => {
      const r = await db.query.response.findFirst({
        where: (res, { eq: eqRes }) =>
          eqRes(res.id, responseId) && eqRes(res.entityType, "gig"),
      });
      if (!r) throw new Error("Response not found");
      const g = await db.query.gig.findFirst({
        where: (gigTable, { eq: eqGig }) =>
          eqGig(gigTable.id, r.entityId) &&
          eqGig(gigTable.workspaceId, workspaceId),
      });
      if (!g) throw new Error("Gig not found");
      return { response: r, gig: g };
    });

    const profileData = responseData.response.profileData as
      | (StoredProfileData & {
          kworkWorkerId?: number;
          kworkLastProcessedMessageId?: number;
        })
      | null
      | undefined;
    const workerId = profileData?.kworkWorkerId;
    if (workerId == null) {
      return { success: false, error: "Kwork worker ID not found in response" };
    }

    const inboxResult = await step.run("fetch-inbox", async () => {
      try {
        return await executeWithKworkTokenRefresh(
          db,
          workspaceId,
          (api, token) =>
            getInboxTracks(api, token, {
              userId: workerId,
              limit: 30,
              direction: "before",
            }),
          { publish: publish as (event: object) => Promise<void> },
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return {
          success: false,
          error: { message: msg },
          response: undefined,
        };
      }
    });

    const inboxMessages = inboxResult.response as
      | KworkInboxMessage[]
      | undefined;
    if (!inboxResult.success || !inboxMessages?.length) {
      return { success: true, processed: 0 };
    }
    const messagesFromWorker = inboxMessages.filter(
      (m: { from_id?: number }) => m.from_id === workerId,
    );
    const lastProcessed =
      profileData?.kworkLastProcessedMessageId ??
      (profileData as { kworkLastProcessedMessageId?: number })
        ?.kworkLastProcessedMessageId;
    const newMessages = lastProcessed
      ? messagesFromWorker.filter(
          (m: { conversation_id?: number; message_id?: number }) =>
            (m.conversation_id ?? m.message_id ?? 0) > lastProcessed,
        )
      : messagesFromWorker;

    const latestNew = newMessages[newMessages.length - 1];
    if (!latestNew?.message) {
      return { success: true, processed: 0 };
    }

    const aiResponse = await step.run("generate-ai-response", async () => {
      const { text } = await generateText({
        model: undefined,
        messages: [
          {
            role: "system",
            content: `Ты — представитель заказчика на бирже Kwork. Веди краткий профессиональный диалог с фрилансером по проекту. Отвечай на русском, лаконично.`,
          },
          {
            role: "user",
            content: latestNew.message ?? "",
          },
        ],
        generationName: "kwork-chat-response",
        entityId: responseId,
      });
      return text;
    });

    const sendResult = await step.run("send-kwork-message", async () => {
      try {
        return await executeWithKworkTokenRefresh(
          db,
          workspaceId,
          (api, token) =>
            kworkSendMessage(
              api,
              token,
              workerId,
              aiResponse ?? "Спасибо за ответ!",
            ),
          { publish: publish as (event: object) => Promise<void> },
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return { success: false, error: { message: msg } };
      }
    });

    if (!sendResult.success) {
      const err = sendResult.error as { message?: string } | undefined;
      return {
        success: false,
        error: err?.message ?? "Failed to send message",
      };
    }

    const newLastId =
      latestNew.conversation_id ?? latestNew.message_id ?? lastProcessed;
    if (newLastId) {
      await step.run("update-last-processed", async () => {
        const current = (responseData.response.profileData ?? {}) as Record<
          string,
          unknown
        >;
        await db
          .update(responseTable)
          .set({
            profileData: {
              ...current,
              kworkLastProcessedMessageId: newLastId,
            } as StoredProfileData,
            updatedAt: new Date(),
          })
          .where(eq(responseTable.id, responseId));
      });
    }

    return { success: true, processed: 1 };
  },
);
