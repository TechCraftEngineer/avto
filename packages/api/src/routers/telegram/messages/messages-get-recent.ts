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
import { protectedProcedure } from "../../../trpc";
import { verifyWorkspaceAccess } from "../utils";

export const getRecentMessagesRouter = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      limit: z.number().min(1).max(100).default(10),
    }),
  )
  .query(async ({ input, ctx }) => {
    await verifyWorkspaceAccess(
      ctx.workspaceRepository,
      input.workspaceId,
      ctx.session.user.id,
    );

    const messages = await ctx.db
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
