import { ORPCError } from "@orpc/server";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const cancel = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      email: z.string().email(),
    }),
  )
  .handler(async ({ input, context }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access || (access.role !== "owner" && access.role !== "admin")) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для отмены приглашений",
      });
    }

    const invite = await context.workspaceRepository.findInviteByEmail(
      input.workspaceId,
      input.email,
    );

    if (!invite) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Приглашение не найдено",
      });
    }

    await context.workspaceRepository.cancelInviteByEmail(
      input.workspaceId,
      input.email,
    );

    return { success: true };
  });
