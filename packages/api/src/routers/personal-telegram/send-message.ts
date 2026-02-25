/**
 * Отправка сообщения кандидату через личный Telegram.
 * Создаёт personal_chat_session при первом контакте.
 */

import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import {
  candidateOrganization,
  globalCandidate,
  personalChatMessage,
  personalChatSession,
} from "@qbs-autonaim/db/schema";
import { tgClientSDK } from "@qbs-autonaim/tg-client/sdk";
import { uuidv7Schema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const sendMessageRouter = protectedProcedure
  .input(
    z.object({
      candidateId: uuidv7Schema,
      organizationId: z.string().min(1),
      content: z.string().min(1).max(4000),
    }),
  )
  .handler(async ({ input, context }) => {
    const userId = context.session.user.id;

    const hasAccess = await context.organizationRepository.checkAccess(
      input.organizationId,
      userId,
    );
    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к организации",
      });
    }

    const candidate = await context.db.query.globalCandidate.findFirst({
      where: eq(globalCandidate.id, input.candidateId),
      columns: {
        id: true,
        fullName: true,
        telegramUsername: true,
      },
    });

    if (!candidate) {
      throw new ORPCError("NOT_FOUND", {
        message: "Кандидат не найден",
      });
    }

    if (!candidate.telegramUsername) {
      throw new ORPCError("BAD_REQUEST", {
        message:
          "У кандидата не указан Telegram. Добавьте @username в профиль.",
      });
    }

    const link = await context.db.query.candidateOrganization.findFirst({
      where: and(
        eq(candidateOrganization.candidateId, input.candidateId),
        eq(candidateOrganization.organizationId, input.organizationId),
      ),
    });
    if (!link) {
      throw new ORPCError("FORBIDDEN", {
        message: "Кандидат не в вашей организации",
      });
    }

    const result = await tgClientSDK.sendPersonalMessageByUsername({
      userId,
      username: candidate.telegramUsername.replace(/^@/, ""),
      text: input.content,
    });

    let session = await context.db.query.personalChatSession.findFirst({
      where: and(
        eq(personalChatSession.userId, userId),
        eq(personalChatSession.globalCandidateId, input.candidateId),
      ),
    });

    if (!session) {
      const [newSession] = await context.db
        .insert(personalChatSession)
        .values({
          userId,
          globalCandidateId: input.candidateId,
          telegramChatId: result.chatId,
          metadata: {
            candidateName: candidate.fullName,
            telegramUsername: candidate.telegramUsername,
          },
        })
        .returning();
      session = newSession!;
    } else if (session.telegramChatId !== result.chatId) {
      await context.db
        .update(personalChatSession)
        .set({
          telegramChatId: result.chatId,
          lastMessageAt: new Date(),
        })
        .where(eq(personalChatSession.id, session.id));
    }

    const [message] = await context.db
      .insert(personalChatMessage)
      .values({
        sessionId: session.id,
        role: "user",
        type: "text",
        content: input.content,
        externalId: result.messageId,
      })
      .returning();

    await context.db
      .update(personalChatSession)
      .set({ lastMessageAt: new Date() })
      .where(eq(personalChatSession.id, session.id));

    return message!;
  });
