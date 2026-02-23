import { and, eq } from "@qbs-autonaim/db";
import { gig } from "@qbs-autonaim/db/schema";
import { gigWorkspaceInputSchema } from "@qbs-autonaim/validators";
import { protectedProcedure } from "../../../orpc";
import { ensureFound } from "../../../utils/ensure-found";
import { verifyWorkspaceAccess } from "../../../utils/verify-workspace-access";

export const deleteGig = protectedProcedure
  .input(gigWorkspaceInputSchema)
  .handler(async ({ context, input }) => {
    await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.workspaceId,
      context.session.user.id,
    );

    ensureFound(
      await context.db.query.gig.findFirst({
        where: and(
          eq(gig.id, input.gigId),
          eq(gig.workspaceId, input.workspaceId),
        ),
      }),
      "Задание не найдено",
    );

    await context.db
      .delete(gig)
      .where(
        and(eq(gig.id, input.gigId), eq(gig.workspaceId, input.workspaceId)),
      );

    return { success: true };
  });
