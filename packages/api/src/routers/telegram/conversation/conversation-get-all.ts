import {
  and,
  desc,
  eq,
  inArray,
  interviewMessage,
  interviewSession,
  response as responseTable,
  vacancy,
} from "@qbs-autonaim/db";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";
import { verifyWorkspaceAccess } from "../utils";

export const getAllConversationsRouter = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      vacancyId: z.string().optional(),
    }),
  )
  .query(async ({ input, ctx }) => {
    await verifyWorkspaceAccess(
      ctx.workspaceRepository,
      input.workspaceId,
      ctx.session.user.id,
    );

    const sessions = await ctx.db
      .select()
      .from(interviewSession)
      .innerJoin(
        responseTable,
        eq(interviewSession.responseId, responseTable.id),
      )
      .innerJoin(vacancy, eq(responseTable.entityId, vacancy.id))
      .where(
        input.vacancyId
          ? and(
              eq(responseTable.entityType, "vacancy"),
              eq(vacancy.workspaceId, input.workspaceId),
              eq(responseTable.entityId, input.vacancyId),
            )
          : and(
              eq(responseTable.entityType, "vacancy"),
              eq(vacancy.workspaceId, input.workspaceId),
            ),
      );

    if (sessions.length === 0) {
      return [];
    }

    const sessionIds = sessions.map((s) => s.interview_sessions.id);

    const allMessages = await ctx.db
      .select()
      .from(interviewMessage)
      .where(inArray(interviewMessage.sessionId, sessionIds))
      .orderBy(desc(interviewMessage.createdAt));

    const messagesBySession = new Map<string, (typeof allMessages)[0]>();
    for (const msg of allMessages) {
      if (!messagesBySession.has(msg.sessionId)) {
        messagesBySession.set(msg.sessionId, msg);
      }
    }

    const sessionsWithMessages = sessions.map((s) => {
      const lastMessage = messagesBySession.get(s.interview_sessions.id);
      return {
        ...s.interview_sessions,
        messages: lastMessage ? [lastMessage] : [],
        response: {
          ...s.responses,
          vacancy: s.vacancies,
        },
      };
    });

    sessionsWithMessages.sort((a, b) => {
      const aLastMessage = a.messages[0];
      const bLastMessage = b.messages[0];

      if (!aLastMessage && !bLastMessage) return 0;
      if (!aLastMessage) return 1;
      if (!bLastMessage) return -1;

      return (
        bLastMessage.createdAt.getTime() - aLastMessage.createdAt.getTime()
      );
    });

    return sessionsWithMessages;
  });
