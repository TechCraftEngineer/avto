import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";
import {
  requireWorkspaceRole,
  verifyWorkspaceAccess,
} from "../../utils/verify-workspace-access";

export const deleteWorkspace = protectedProcedure
  .input(z.object({ id: workspaceIdSchema }))
  .handler(async ({ input, context }) => {
    const access = await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.id,
      context.session.user.id,
    );
    requireWorkspaceRole(access, ["owner"]);

    await context.workspaceRepository.delete(input.id);
    return { success: true };
  });
