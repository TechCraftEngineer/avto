import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import {
  requireWorkspaceRole,
  verifyWorkspaceAccess,
} from "../../../utils/verify-workspace-access";

export const createLink = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      role: z.enum(["owner", "admin", "member"]).default("member"),
    }),
  )
  .handler(async ({ input, context }) => {
    const access = await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.workspaceId,
      context.session.user.id,
    );
    requireWorkspaceRole(access, ["owner", "admin"]);

    const invite = await context.workspaceRepository.createInviteLink(
      input.workspaceId,
      context.session.user.id,
      input.role,
    );

    return invite;
  });
