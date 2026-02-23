import { ORPCError } from "@orpc/server";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { ensureFound } from "../../../utils/ensure-found";
import {
  requireWorkspaceRole,
  verifyWorkspaceAccess,
} from "../../../utils/verify-workspace-access";

export const remove = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      userId: z.string(),
    }),
  )
  .handler(async ({ input, context }) => {
    const isSelfRemoval = input.userId === context.session.user.id;

    const access = await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.workspaceId,
      context.session.user.id,
    );
    if (!isSelfRemoval) {
      requireWorkspaceRole(access, ["owner", "admin"]);
    }

    const targetUserAccess = ensureFound(
      await context.workspaceRepository.checkAccess(
        input.workspaceId,
        input.userId,
      ),
      "Пользователь не является участником workspace",
    );

    if (targetUserAccess.role === "owner") {
      const members = await context.workspaceRepository.getMembers(
        input.workspaceId,
      );
      const ownerCount = members.filter((m) => m.role === "owner").length;

      if (ownerCount <= 1) {
        throw new ORPCError("BAD_REQUEST", {
          message:
            "Невозможно удалить последнего владельца workspace. Назначьте другого владельца перед удалением.",
        });
      }
    }

    await context.workspaceRepository.removeUser(
      input.workspaceId,
      input.userId,
    );
    return { success: true };
  });
