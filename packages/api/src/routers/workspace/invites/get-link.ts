import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { verifyWorkspaceAccess } from "../../../utils/verify-workspace-access";

export const getLink = protectedProcedure
  .input(z.object({ workspaceId: workspaceIdSchema }))
  .handler(async ({ input, context }) => {
    await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.workspaceId,
      context.session.user.id,
    );

    const invite = await context.workspaceRepository.getActiveInviteLink(
      input.workspaceId,
    );

    return invite;
  });
