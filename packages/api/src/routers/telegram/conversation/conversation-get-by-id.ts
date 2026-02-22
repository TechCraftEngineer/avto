import {
  eq,
  interviewSession,
  response as responseTable,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { verifyWorkspaceAccess } from "../utils";

export const getConversationByIdRouter = protectedProcedure
  .input(z.object({ id: uuidv7Schema, workspaceId: workspaceIdSchema }))
  .query(async ({ input, ctx }) => {
    await verifyWorkspaceAccess(
      ctx.workspaceRepository,
      input.workspaceId,
      ctx.session.user.id,
    );

    const session = await ctx.db.query.interviewSession.findFirst({
      where: eq(interviewSession.id, input.id),
    });

    if (!session) {
      return null;
    }

    // Check workspace access through response
    if (session.responseId) {
      const responseRow = await ctx.db.query.response.findFirst({
        where: eq(responseTable.id, session.responseId),
      });

      if (responseRow) {
        const vacancy = await ctx.db.query.vacancy.findFirst({
          where: eq(vacancyTable.id, responseRow.entityId),
          columns: { workspaceId: true },
        });

        if (!vacancy || vacancy.workspaceId !== input.workspaceId) {
          throw new ORPCError({
            code: "FORBIDDEN",
            message: "Нет доступа к этой беседе",
          });
        }
      }
    }

    return session;
  });
