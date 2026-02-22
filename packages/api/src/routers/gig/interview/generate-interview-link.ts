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
  .mutation(async ({ input, ctx }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    const foundGig = await ctx.db.query.gig.findFirst({
      where: and(
        eq(gig.id, input.gigId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!foundGig) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Гиг не найден",
      });
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
