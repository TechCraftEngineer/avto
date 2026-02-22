import { deleteIntegration } from "@qbs-autonaim/db";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const deleteIntegrationProcedure = protectedProcedure
  .input(z.object({ type: z.string(), workspaceId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    // Проверка доступа к workspace
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access || (access.role !== "owner" && access.role !== "admin")) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для удаления интеграций",
      });
    }

    await deleteIntegration(ctx.db, input.type, input.workspaceId);
    return { success: true };
  });
