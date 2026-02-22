import { and, eq } from "@qbs-autonaim/db";
import { telegramSession } from "@qbs-autonaim/db/schema";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const clearAuthErrorRouter = protectedProcedure
  .input(z.object({ sessionId: z.string(), workspaceId: z.string() }))
  .handler(async ({ input, context }) => {
    const result = await context.db
      .update(telegramSession)
      .set({
        authError: null,
        authErrorAt: null,
        authErrorNotifiedAt: null,
        isActive: true,
      })
      .where(
        and(
          eq(telegramSession.id, input.sessionId),
          eq(telegramSession.workspaceId, input.workspaceId),
        ),
      )
      .returning();

    if (result.length === 0) {
      throw new ORPCError("NOT_FOUND", { message: "Сессия не найдена", });
    }

    return { success: true };
  });
