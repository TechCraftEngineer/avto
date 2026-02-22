import { ORPCError } from "@orpc/server";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const createLink = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      role: z.enum(["owner", "admin", "member"]).default("member"),
    }),
  )
  .handler(async ({ input, context }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access || (access.role !== "owner" && access.role !== "admin")) {
      throw new ORPCError("FORBIDDEN", {
        message: "Недостаточно прав для создания приглашений",
      });
    }

    const invite = await context.workspaceRepository.createInviteLink(
      input.workspaceId,
      context.session.user.id,
      input.role,
    );

    return invite;
  });
