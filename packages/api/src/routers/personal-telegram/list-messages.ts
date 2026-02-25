/**
 * Список сообщений личного чата с кандидатом
 */

import { ORPCError } from "@orpc/server";
import { and, desc, eq } from "@qbs-autonaim/db";
import {
  candidateOrganization,
  personalChatMessage,
  personalChatSession,
} from "@qbs-autonaim/db/schema";
import { uuidv7Schema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const listMessagesRouter = protectedProcedure
  .input(
    z.object({
      candidateId: uuidv7Schema,
      organizationId: z.string().min(1),
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

    const session = await context.db.query.personalChatSession.findFirst({
      where: and(
        eq(personalChatSession.userId, userId),
        eq(personalChatSession.globalCandidateId, input.candidateId),
      ),
    });

    if (!session) return [];

    const messages = await context.db.query.personalChatMessage.findMany({
      where: eq(personalChatMessage.sessionId, session.id),
      orderBy: desc(personalChatMessage.createdAt),
      limit: 100,
    });

    const candidateName =
      (session.metadata as { candidateName?: string })?.candidateName ||
      "Кандидат";

    return messages.reverse().map((m) => ({
      id: m.id,
      content: m.content,
      sender: m.role === "user" ? "recruiter" : "candidate",
      senderName: m.role === "user" ? "Вы" : candidateName,
      timestamp: m.createdAt,
      type: m.type as "text" | "voice",
    }));
  });
