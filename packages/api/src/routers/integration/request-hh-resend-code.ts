import { ORPCError } from "@orpc/server";
import { saveHHResendRequested } from "@qbs-autonaim/db";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const requestHHResendCode = protectedProcedure
  .input(z.object({ workspaceId: workspaceIdSchema }))
  .handler(async ({ input, context }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к workspace" });
    }

    try {
      await saveHHResendRequested(context.db, input.workspaceId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("not found") ||
        msg.includes("Integration hh not found")
      ) {
        throw new ORPCError("NOT_FOUND", {
          message: "Интеграция HH не найдена",
        });
      }
      throw err;
    }

    return { ok: true };
  });
