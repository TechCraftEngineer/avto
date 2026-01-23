import { telegramSession } from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const getSessionStatusRouter = protectedProcedure
  .input(z.object({ sessionId: z.string(), workspaceId: z.string() }))
  .query(async ({ input, ctx }) => {
    const [session] = await ctx.db
      .select()
      .from(telegramSession)
      .where(
        and(
          eq(telegramSession.id, input.sessionId),
          eq(telegramSession.workspaceId, input.workspaceId),
        ),
      )
      .limit(1);

    if (!session) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Сессия не найдена",
      });
    }

    return {
      id: session.id,
      phone: session.phone,
      isActive: session.isActive,
      authError: session.authError,
      authErrorAt: session.authErrorAt,
      authErrorNotifiedAt: session.authErrorNotifiedAt,
      lastUsedAt: session.lastUsedAt,
      userInfo: session.userInfo,
    };
  });
