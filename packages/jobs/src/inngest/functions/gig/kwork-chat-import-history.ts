import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db";
import {
  interviewMessage,
  interviewSession,
  response as responseTable,
} from "@qbs-autonaim/db/schema";
import {
  getInboxTracks,
  type KworkInboxMessage,
} from "@qbs-autonaim/integration-clients";
import type { StoredProfileData } from "@qbs-autonaim/db";
import { executeWithKworkTokenRefresh } from "../../../services/kwork";
import { inngest } from "../../client";

/**
 * Импорт истории чатов Kwork: загрузка всех сообщений диалога и сохранение в interview_session
 */
export const kworkChatImportHistoryFunction = inngest.createFunction(
  {
    id: "kwork-chat-import-history",
    name: "Import Kwork Chat History",
  },
  { event: "kwork-chat/import-history" },
  async ({ event, step, publish }) => {
    const { responseId, workspaceId } = event.data;

    const responseData = await step.run("fetch-response", async () => {
      const r = await db.query.response.findFirst({
        where: (res, { eq: eqRes }) =>
          eqRes(res.id, responseId) && eqRes(res.entityType, "gig"),
      });
      if (!r) throw new Error("Response not found");
      return { response: r };
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
      return { success: true, imported: 0, reason: "No kworkWorkerId" };
    }

    let session = await step.run("get-or-create-session", async () => {
      const existing = await db.query.interviewSession.findFirst({
        where: eq(interviewSession.responseId, responseId),
      });
      if (existing) return existing;

      const [created] = await db
        .insert(interviewSession)
        .values({
          responseId,
          status: "active",
          lastChannel: "web",
          metadata: { importSource: "kwork" },
        })
        .returning();
      return created!;
    });

    if (!session) {
      return { success: false, error: "Failed to create session" };
    }

    const allMessages: KworkInboxMessage[] = [];
    let lastConversationId: number | undefined;
    let hasMore = true;
    let stepIdx = 0;

    while (hasMore) {
      const currentStepIdx = stepIdx;
      stepIdx += 1;
      const batch = await step.run(
        `fetch-messages-batch-${currentStepIdx}`,
        async () => {
          const result = await executeWithKworkTokenRefresh(
            db,
            workspaceId,
            (token) =>
              getInboxTracks(token, {
                userId: workerId,
                limit: 50,
                lastConversationId,
                direction: "before",
              }),
            { publish: publish as (event: object) => Promise<void> },
          );
          if (!result.success) {
            return {
              messages: [],
              hasMore: false,
              nextLastConversationId: undefined,
            };
          }
          const messages = (result.response as KworkInboxMessage[]) ?? [];
          const oldest = messages.at(-1);
          const nextLastId =
            oldest && (oldest.conversation_id ?? oldest.message_id);
          return {
            messages,
            hasMore: messages.length >= 50 && nextLastId != null,
            nextLastConversationId: nextLastId ?? undefined,
          };
        },
      );
      allMessages.push(...batch.messages);
      hasMore = batch.hasMore;
      lastConversationId = batch.nextLastConversationId;
    }

    const existingExternalIdsList = await step.run(
      "get-existing-external-ids",
      async () => {
        const existing = await db.query.interviewMessage.findMany({
          where: eq(interviewMessage.sessionId, session!.id),
          columns: { externalId: true },
        });
        return existing
          .map((m) => m.externalId)
          .filter((id): id is string => Boolean(id));
      },
    );
    const existingExternalIds = new Set(existingExternalIdsList);

    const toInsert = allMessages
      .filter((m) => (m.message ?? "").trim().length > 0)
      .map((m) => {
        const externalId = String(m.message_id ?? m.conversation_id ?? "");
        const role =
          m.from_id === workerId ? ("user" as const) : ("assistant" as const);
        return {
          sessionId: session!.id,
          role,
          type: "text" as const,
          channel: "web" as const,
          content: (m.message ?? "").trim(),
          externalId: externalId || undefined,
          metadata: m.time
            ? ({ kworkTime: m.time } as Record<string, unknown>)
            : undefined,
          createdAt: m.time
            ? new Date(m.time * 1000)
            : new Date(),
        };
      })
      .filter(
        (m) => m.externalId && !existingExternalIds.has(m.externalId),
      )
      .sort(
        (a, b) =>
          (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0),
      );

    const inserted = await step.run("insert-messages", async () => {
      if (toInsert.length === 0) return 0;
      await db.insert(interviewMessage).values(
        toInsert.map(({ createdAt, ...rest }) => ({
          ...rest,
          createdAt: createdAt ?? new Date(),
        })),
      );
      return toInsert.length;
    });

    const maxMsgId = allMessages.reduce((max, m) => {
      const id = m.conversation_id ?? m.message_id ?? 0;
      return id > max ? id : max;
    }, 0);

    if (maxMsgId > 0) {
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
              kworkLastProcessedMessageId: maxMsgId,
            } as StoredProfileData,
            updatedAt: new Date(),
          })
          .where(eq(responseTable.id, responseId));
      });
    }

    const lastMsg = allMessages[allMessages.length - 1];
    if (lastMsg?.time) {
      await step.run("update-session-last-message", async () => {
        await db
          .update(interviewSession)
          .set({
            lastMessageAt: new Date(lastMsg.time! * 1000),
            messageCount: allMessages.length,
            updatedAt: new Date(),
          })
          .where(eq(interviewSession.id, session!.id));
      });
    }

    return { success: true, imported: inserted, total: allMessages.length };
  },
);
