import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";
import { ensureFound } from "../../utils/ensure-found";
import { verifyWorkspaceAccess } from "../../utils/verify-workspace-access";

export const get = protectedProcedure
  .input(z.object({ id: workspaceIdSchema }))
  .handler(async ({ input, context }) => {
    const workspace = ensureFound(
      await context.workspaceRepository.findById(input.id),
      "Workspace не найден",
    );

    await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.id,
      context.session.user.id,
    );

    return workspace;
  });
