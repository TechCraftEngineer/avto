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

export const getConversationByResponseIdRouter = protectedProcedure
  .input(z.object({ responseId: uuidv7Schema, workspaceId: workspaceIdSchema }))
  .query(async ({ input, ctx }) => {
    await verifyWorkspaceAccess(
      ctx.workspaceRepository,
      input.workspaceId,
      ctx.session.user.id,
    );

    const responseRow = await ctx.db.query.response.findFirst({
      where: eq(responseTable.id, input.responseId),
    });

    if (!responseRow) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Отклик не найден",
      });
    }

    // Check workspace access
    const vacancy = await ctx.db.query.vacancy.findFirst({
      where: eq(vacancyTable.id, responseRow.entityId),
      columns: { workspaceId: true },
    });

    if (!vacancy || vacancy.workspaceId !== input.workspaceId) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому отклику",
      });
    }

    const session = await ctx.db.query.interviewSession.findFirst({
      where: eq(interviewSession.responseId, input.responseId),
    });

    return session;
  });
