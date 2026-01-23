import { telegramSession } from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "@qbs-autonaim/db";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const clearAuthErrorRouter = protectedProcedure
  .input(z.object({ sessionId: z.string(), workspaceId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const result = await ctx.db
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
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Сессия не найдена",
      });
    }

    return { success: true };
  });
