import { and, eq } from "@qbs-autonaim/db";
import { gig, interviewLink } from "@qbs-autonaim/db/schema";
import { getInterviewUrlFromEntity } from "@qbs-autonaim/server-utils";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const getInterviewLink = protectedProcedure
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
