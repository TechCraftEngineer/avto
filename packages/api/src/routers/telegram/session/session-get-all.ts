import { eq, telegramSession } from "@qbs-autonaim/db";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const getSessionsRouter = protectedProcedure
  .input(z.object({ workspaceId: z.string() }))
  .query(async ({ input, ctx }) => {
    const sessions = await ctx.db
      .select()
      .from(telegramSession)
      .where(eq(telegramSession.workspaceId, input.workspaceId));

    return sessions.map((s) => ({
      id: s.id,
      phone: s.phone,
      userInfo: s.userInfo,
      isActive: s.isActive,
      authError: s.authError,
      authErrorAt: s.authErrorAt,
      lastUsedAt: s.lastUsedAt,
      createdAt: s.createdAt,
    }));
  });
