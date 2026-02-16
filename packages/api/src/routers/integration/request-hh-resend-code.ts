import { saveHHResendRequested } from "@qbs-autonaim/db";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const requestHHResendCode = protectedProcedure
  .input(z.object({ workspaceId: workspaceIdSchema }))
  .mutation(async ({ input, ctx }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    try {
      await saveHHResendRequested(ctx.db, input.workspaceId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("not found") || msg.includes("Integration hh not found")) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Интеграция HH не найдена",
        });
      }
      throw err;
    }

    return { ok: true };
  });
