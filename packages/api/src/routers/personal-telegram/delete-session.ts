import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import { userTelegramSession } from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const deleteSessionRouter = protectedProcedure
  .input(z.object({ sessionId: z.string() }))
  .handler(async ({ input, context }) => {
    const userId = context.session.user.id;

    const result = await context.db
      .delete(userTelegramSession)
      .where(
        and(
          eq(userTelegramSession.id, input.sessionId),
          eq(userTelegramSession.userId, userId),
        ),
      )
      .returning();

    if (result.length === 0) {
      throw new ORPCError("NOT_FOUND", {
        message: "Сессия не найдена или не принадлежит вам",
      });
    }

    return { success: true };
  });
