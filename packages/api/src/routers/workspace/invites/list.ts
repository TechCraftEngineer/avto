import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import {
  requireWorkspaceRole,
  verifyWorkspaceAccess,
} from "../../../utils/verify-workspace-access";

export const list = protectedProcedure
  .input(z.object({ workspaceId: workspaceIdSchema }))
  .handler(async ({ input, context }) => {
    const access = await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.workspaceId,
      context.session.user.id,
    );
    requireWorkspaceRole(access, ["owner", "admin"]);

    const invites = await context.workspaceRepository.getInvites(
      input.workspaceId,
    );
    return invites;
  });
