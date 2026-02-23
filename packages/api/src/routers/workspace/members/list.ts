import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { verifyWorkspaceAccess } from "../../../utils/verify-workspace-access";

export const list = protectedProcedure
  .input(z.object({ workspaceId: workspaceIdSchema }))
  .handler(async ({ input, context }) => {
    await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.workspaceId,
      context.session.user.id,
    );

    const members = await context.workspaceRepository.getMembers(
      input.workspaceId,
    );
    return members;
  });
