import {
  and,
  desc,
  eq,
  interviewMessage,
  interviewSession,
  response as responseTable,
  vacancy,
} from "@qbs-autonaim/db";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { verifyWorkspaceAccess } from "../utils";

export const getRecentMessagesRouter = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      limit: z.number().min(1).max(100).default(10),
    }),
  )
  .handler(async ({ input, context }) => {
    await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.workspaceId,
      context.session.user.id,
    );

    const messages = await context.db
      .select({
        message: interviewMessage,
        session: interviewSession,
        response: responseTable,
        vacancy: vacancy,
      })
      .from(interviewMessage)
      .innerJoin(
        interviewSession,
        eq(interviewMessage.sessionId, interviewSession.id),
      )
      .innerJoin(
        responseTable,
        eq(interviewSession.responseId, responseTable.id),
      )
      .innerJoin(vacancy, eq(responseTable.entityId, vacancy.id))
      .where(
        and(
          eq(responseTable.entityType, "vacancy"),
          eq(vacancy.workspaceId, input.workspaceId),
        ),
      )
      .orderBy(desc(interviewMessage.createdAt))
      .limit(input.limit);

    return messages.map((row) => ({
      ...row.message,
      session: {
        ...row.session,
        response: {
          ...row.response,
          vacancy: row.vacancy,
        },
      },
    }));
  });
