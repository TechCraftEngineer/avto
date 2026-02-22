import { inngest } from "@qbs-autonaim/jobs/client";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

const syncGigResponsesInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  gigId: z.string().uuid(),
});

export const syncGigResponses = protectedProcedure
  .input(syncGigResponsesInputSchema)
  .mutation(async ({ input, ctx }) => {
    // Проверяем доступ к workspace
    const hasAccess = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    // Получаем gig
    const gigRecord = await ctx.db.query.gig.findFirst({
      where: (gig, { eq, and }) =>
        and(eq(gig.id, input.gigId), eq(gig.workspaceId, input.workspaceId)),
    });

    if (!gigRecord) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Задание не найдено",
      });
    }

    // Проверяем, что у gig есть ссылка на фриланс-платформу
    if (!gigRecord.url || !gigRecord.externalId) {
      throw new ORPCError({
        code: "BAD_REQUEST",
        message: "У задания нет ссылки на фриланс-платформу",
      });
    }

    await inngest.send({
      name: "gig/sync-responses",
      data: { gigId: input.gigId },
    });

    return {
      success: true,
      message: "Синхронизация откликов запущена",
      platform: gigRecord.source,
      externalId: gigRecord.externalId,
    };
  });
