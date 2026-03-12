/**
 * Обработчик входящих сообщений личного Telegram.
 * Только логирование в профиль кандидата — без AI-интервью.
 * Полностью изолирован от telegram/message.received (workspace, автоинтервью).
 */

import { and, eq, inArray } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  candidateOrganization,
  globalCandidate,
  organizationMember,
  personalChatMessage,
  personalChatSession,
} from "@qbs-autonaim/db/schema";
import { inngest } from "../../client";

interface PersonalMessagePayload {
  userId: string;
  messageData: {
    id: number;
    chatId: string;
    text?: string;
    isOutgoing: boolean;
    sender?: { username?: string; firstName?: string };
    media?: { type: string };
  };
}

export const processPersonalIncomingMessageFunction = inngest.createFunction(
  {
    id: "telegram-process-personal-incoming-message",
    name: "Process Personal Telegram Incoming Message",
    retries: 3,
  },
  { event: "telegram/personal.message.received" },
  async ({ event, step }) => {
    // Заглушка — обработка отключена
    return { skipped: true, reason: "stub: processing disabled" };

    const { userId, messageData } = event.data as PersonalMessagePayload;

    if (messageData.isOutgoing) {
      return { skipped: true, reason: "outgoing message" };
    }

    const chatId = messageData.chatId;
    const username = messageData.sender?.username;

    // 1. Ищем существующую сессию по userId + chatId
    const existingSession = await step.run("find-session", async () => {
      return db.query.personalChatSession.findFirst({
        where: and(
          eq(personalChatSession.userId, userId),
          eq(personalChatSession.telegramChatId, chatId),
        ),
      });
    });

    let sessionId: string;
    let globalCandidateId: string;

    if (existingSession) {
      sessionId = existingSession.id;
      globalCandidateId = existingSession.globalCandidateId;
    } else {
      // 2. Сессия не найдена — пробуем идентифицировать по username
      if (!username) {
        console.log("⏭️ Неизвестный чат, username отсутствует", { chatId });
        return { skipped: true, reason: "no session and no username" };
      }

      const identified = await step.run("identify-candidate", async () => {
        // Организации пользователя
        const userOrgs = await db
          .select({ organizationId: organizationMember.organizationId })
          .from(organizationMember)
          .where(eq(organizationMember.userId, userId));

        const orgIds = userOrgs.map((o) => o.organizationId).filter(Boolean);
        if (orgIds.length === 0) return null;

        // Кандидаты в этих организациях с данным telegram
        const match = await db
          .select({
            globalCandidateId: candidateOrganization.candidateId,
            candidateName: globalCandidate.fullName,
          })
          .from(candidateOrganization)
          .innerJoin(
            globalCandidate,
            eq(candidateOrganization.candidateId, globalCandidate.id),
          )
          .where(
            and(
              inArray(candidateOrganization.organizationId, orgIds),
              eq(globalCandidate.telegramUsername, username),
            ),
          )
          .limit(1)
          .then((rows) => rows[0]);

        return match;
      });

      if (!identified) {
        console.log("⏭️ Кандидат не найден в пуле организации", {
          username,
          chatId,
        });
        return { skipped: true, reason: "candidate not in org pool" };
      }

      globalCandidateId = identified.globalCandidateId;

      const [newSession] = await step.run("create-session", async () => {
        return db
          .insert(personalChatSession)
          .values({
            userId,
            globalCandidateId,
            telegramChatId: chatId,
            metadata: {
              candidateName: identified.candidateName,
              telegramUsername: username,
            },
          })
          .returning();
      });

      if (!newSession) {
        throw new Error("Failed to create personal chat session");
      }
      sessionId = newSession.id;
    }

    // 3. Сохраняем сообщение
    if (messageData.text) {
      await step.run("save-text-message", async () => {
        await db.insert(personalChatMessage).values({
          sessionId,
          role: "candidate",
          type: "text",
          content: messageData.text,
          externalId: messageData.id.toString(),
        });
      });

      await step.run("update-session-timestamp", async () => {
        await db
          .update(personalChatSession)
          .set({ lastMessageAt: new Date() })
          .where(eq(personalChatSession.id, sessionId));
      });
    }

    // Голосовые можно обработать позже (транскрипция) — пока пропускаем
    if (
      messageData.media?.type === "voice" ||
      messageData.media?.type === "audio"
    ) {
      console.log("🎤 Голосовое в личном чате — пока не обрабатывается", {
        sessionId,
        messageId: messageData.id,
      });
    }

    return {
      processed: true,
      sessionId,
      globalCandidateId,
      messageType: messageData.text ? "text" : "media",
    };
  },
);
