import { ORPCError } from "@orpc/server";
import {
  eq,
  interviewSession,
  response as responseTable,
  sql,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { verifyWorkspaceAccess } from "../utils";

export const getConversationByUsernameRouter = protectedProcedure
  .input(z.object({ username: z.string(), workspaceId: workspaceIdSchema }))
  .handler(async ({ input, context }) => {
    await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.workspaceId,
      context.session.user.id,
    );

    // Search by telegramUsername in metadata
    const session = await context.db.query.interviewSession.findFirst({
      where: sql`${interviewSession.metadata}->>'telegramUsername' = ${input.username}`,
    });

    if (!session) {
      return null;
    }

    // Check workspace access through response
    if (session.responseId) {
      const responseRow = await context.db.query.response.findFirst({
        where: eq(responseTable.id, session.responseId),
      });

      if (responseRow) {
        const vacancy = await context.db.query.vacancy.findFirst({
          where: eq(vacancyTable.id, responseRow.entityId),
          columns: { workspaceId: true },
        });

        if (!vacancy || vacancy.workspaceId !== input.workspaceId) {
          throw new ORPCError("FORBIDDEN", {
            message: "Нет доступа к этой беседе",
          });
        }
      }
    }

    return session;
  });
