import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { ensureFound } from "../../../utils/ensure-found";
import {
  requireWorkspaceRole,
  verifyWorkspaceAccess,
} from "../../../utils/verify-workspace-access";

export const cancel = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      email: z.string().email(),
    }),
  )
  .handler(async ({ input, context }) => {
    const access = await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.workspaceId,
      context.session.user.id,
    );
    requireWorkspaceRole(access, ["owner", "admin"]);

    ensureFound(
      await context.workspaceRepository.findInviteByEmail(
        input.workspaceId,
        input.email,
      ),
      "Приглашение не найдено",
    );

    await context.workspaceRepository.cancelInviteByEmail(
      input.workspaceId,
      input.email,
    );

    return { success: true };
  });
