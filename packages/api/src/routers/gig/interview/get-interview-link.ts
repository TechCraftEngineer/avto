import { and, eq } from "@qbs-autonaim/db";
import { gig, interviewLink } from "@qbs-autonaim/db/schema";
import { getInterviewUrlFromEntity } from "@qbs-autonaim/server-utils";
import { gigWorkspaceInputSchema } from "@qbs-autonaim/validators";
import { protectedProcedure } from "../../../orpc";
import { ensureFound } from "../../../utils/ensure-found";
import { verifyWorkspaceAccess } from "../../../utils/verify-workspace-access";

export const getInterviewLink = protectedProcedure
  .input(gigWorkspaceInputSchema)
  .handler(async ({ input, context }) => {
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
      "Гиг не найден",
    );

    const link = await context.db.query.interviewLink.findFirst({
      where: and(
        eq(interviewLink.entityType, "gig"),
        eq(interviewLink.entityId, input.gigId),
        eq(interviewLink.isActive, true),
      ),
    });

    if (!link) {
      return null;
    }

    const url = await getInterviewUrlFromEntity(link.token, "gig", input.gigId);

    return {
      id: link.id,
      gigId: link.entityId,
      token: link.token,
      url,
      isActive: link.isActive,
      createdAt: link.createdAt,
    };
  });
