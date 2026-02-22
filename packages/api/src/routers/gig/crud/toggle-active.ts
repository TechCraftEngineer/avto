import { ORPCError } from "@orpc/server";
import { and, eq, not } from "@qbs-autonaim/db";
import { gig } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const toggleActive = protectedProcedure
  .input(
    z.object({
      gigId: z.uuid(),
      workspaceId: workspaceIdSchema,
    }),
  )
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

    const [updated] = await context.db
      .update(gig)
      .set({
        isActive: not(gig.isActive),
        updatedAt: new Date(),
      })
      .where(
        and(eq(gig.id, input.gigId), eq(gig.workspaceId, input.workspaceId)),
      )
      .returning({ id: gig.id, title: gig.title, isActive: gig.isActive });

    if (!updated) {
      throw new ORPCError("NOT_FOUND", { message: "Задание не найдено" });
    }

    return {
      id: updated.id,
      title: updated.title,
      isActive: updated.isActive,
    };
  });
