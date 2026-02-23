import { updateUserRoleSchema } from "@qbs-autonaim/validators";
import { protectedProcedure } from "../../../orpc";
import {
  requireWorkspaceRole,
  verifyWorkspaceAccess,
} from "../../../utils/verify-workspace-access";

export const updateRole = protectedProcedure
  .input(updateUserRoleSchema)
  .handler(async ({ input, context }) => {
    const access = await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.workspaceId,
      context.session.user.id,
    );
    requireWorkspaceRole(access, ["owner"]);

    const updated = await context.workspaceRepository.updateUserRole(
      input.workspaceId,
      input.userId,
      input.role,
    );

    return updated;
  });
