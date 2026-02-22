import { and, eq } from "@qbs-autonaim/db";
import { gig } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { GigInterviewLinkGenerator } from "../../../services";
import { protectedProcedure } from "../../../orpc";

export const generateInterviewLink = protectedProcedure
  .input(
    z.object({
      gigId: z.uuid(),
      workspaceId: workspaceIdSchema,
    }),
  )
  .handler(async ({ input, context }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к этому workspace", });
    }

    const foundGig = await context.db.query.gig.findFirst({
      where: and(
        eq(gig.id, input.gigId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!foundGig) {
      throw new ORPCError("NOT_FOUND", { message: "Гиг не найден", });
    }

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
