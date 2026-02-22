import { ORPCError } from "@orpc/server";
import { deleteIntegration } from "@qbs-autonaim/db";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const deleteIntegrationProcedure = protectedProcedure
  .input(z.object({ type: z.string(), workspaceId: z.string() }))
  .handler(async ({ input, context }) => {
    // Проверка доступа к workspace
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access || (access.role !== "owner" && access.role !== "admin")) {
      throw new ORPCError("FORBIDDEN", {
        message: "Недостаточно прав для удаления интеграций",
      });
    }

    await deleteIntegration(context.db, input.type, input.workspaceId);
    return { success: true };
  });
