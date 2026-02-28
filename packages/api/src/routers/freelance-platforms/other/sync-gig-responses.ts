import { ORPCError } from "@orpc/server";
import { inngest } from "@qbs-autonaim/jobs/client";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

const syncGigResponsesInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  gigId: z.uuid(),
});

export const syncGigResponses = protectedProcedure
  .input(syncGigResponsesInputSchema)
  .handler(async ({ input, context }) => {
    // Проверяем доступ к workspace
    const hasAccess = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к workspace" });
    }

    // Получаем gig
    const gigRecord = await context.db.query.gig.findFirst({
      where: (gig, { eq, and }) =>
        and(eq(gig.id, input.gigId), eq(gig.workspaceId, input.workspaceId)),
    });

    if (!gigRecord) {
      throw new ORPCError("NOT_FOUND", { message: "Задание не найдено" });
    }

    // Проверяем, что у gig есть ссылка на фриланс-платформу
    if (!gigRecord.url || !gigRecord.externalId) {
      throw new ORPCError("BAD_REQUEST", {
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
