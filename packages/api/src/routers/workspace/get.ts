import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/client";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const get = protectedProcedure
  .input(z.object({ id: workspaceIdSchema }))
  .handler(async ({ input, context }) => {
    const workspace = await context.workspaceRepository.findById(input.id);

    if (!workspace) {
      throw new ORPCError("NOT_FOUND", {
        message: "Workspace не найден",
      });
    }

    const access = await context.workspaceRepository.checkAccess(
      input.id,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к workspace",
      });
    }

    return workspace;
  });
