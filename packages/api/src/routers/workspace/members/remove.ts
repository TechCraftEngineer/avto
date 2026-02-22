import { ORPCError } from "@orpc/server";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const remove = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      userId: z.string(),
    }),
  )
  .handler(async ({ input, context }) => {
    const isSelfRemoval = input.userId === context.session.user.id;

    const targetUserAccess = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      input.userId,
    );

    if (!targetUserAccess) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Пользователь не является участником workspace",
      });
    }

    if (!isSelfRemoval) {
      const access = await context.workspaceRepository.checkAccess(
        input.workspaceId,
        context.session.user.id,
      );

      if (!access || (access.role !== "owner" && access.role !== "admin")) {
        throw new ORPCError({
          code: "FORBIDDEN",
          message: "Недостаточно прав для удаления пользователей",
        });
      }
    }

    if (targetUserAccess.role === "owner") {
      const members = await context.workspaceRepository.getMembers(
        input.workspaceId,
      );
      const ownerCount = members.filter((m) => m.role === "owner").length;

      if (ownerCount <= 1) {
        throw new ORPCError({
          code: "BAD_REQUEST",
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
