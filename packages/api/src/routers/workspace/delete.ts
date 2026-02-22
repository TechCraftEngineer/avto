import { ORPCError } from "@orpc/server";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const deleteWorkspace = protectedProcedure
  .input(z.object({ id: workspaceIdSchema }))
  .handler(async ({ input, context }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.id,
      context.session.user.id,
    );

    if (!access || access.role !== "owner") {
      throw new ORPCError("FORBIDDEN", { message: "Только owner может удалить workspace",
      });
    }

    await context.workspaceRepository.delete(input.id);
    return { success: true };
  });
