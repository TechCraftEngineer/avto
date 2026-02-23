import { and, eq } from "@qbs-autonaim/db";
import { gig } from "@qbs-autonaim/db/schema";
import { gigWorkspaceInputSchema } from "@qbs-autonaim/validators";
import { protectedProcedure } from "../../../orpc";
import { GigInterviewLinkGenerator } from "../../../services";
import { ensureFound } from "../../../utils/ensure-found";
import { verifyWorkspaceAccess } from "../../../utils/verify-workspace-access";

export const generateInterviewLink = protectedProcedure
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

    const linkGenerator = new GigInterviewLinkGenerator();
    const link = await linkGenerator.generateLink(input.gigId);

    return {
      id: link.id,
      gigId: link.gigId,
      token: link.token,
      url: link.url,
      isActive: link.isActive,
      createdAt: link.createdAt,
    };
  });
