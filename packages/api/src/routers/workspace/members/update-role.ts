import { ORPCError } from "@orpc/server";
import { updateUserRoleSchema } from "@qbs-autonaim/validators";
import { protectedProcedure } from "../../../orpc";

export const updateRole = protectedProcedure
  .input(updateUserRoleSchema)
  .handler(async ({ input, context }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access || access.role !== "owner") {
      throw new ORPCError("FORBIDDEN", { message: "Только owner может изменять роли",
      });
    }

    const updated = await context.workspaceRepository.updateUserRole(
      input.workspaceId,
      input.userId,
      input.role,
    );

    return updated;
  });
