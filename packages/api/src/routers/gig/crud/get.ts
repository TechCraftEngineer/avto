import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import { gig } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const get = protectedProcedure
  .input(z.object({ id: z.uuid(), workspaceId: workspaceIdSchema }))
  .handler(async ({ context, input }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этому workspace",
      });
    }

    const foundGig = await context.db.query.gig.findFirst({
      where: and(eq(gig.id, input.id), eq(gig.workspaceId, input.workspaceId)),
    });

    if (!foundGig) {
      throw new ORPCError("NOT_FOUND", { message: "Gig not found" });
    }

    return foundGig;
  });
