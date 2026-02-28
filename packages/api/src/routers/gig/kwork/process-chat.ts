import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import { gig, response as responseTable } from "@qbs-autonaim/db/schema";
import { inngest } from "@qbs-autonaim/jobs/client";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

/**
 * Запуск обработки Kwork-чата для отклика (опрос новых сообщений и автоответ AI)
 */
export const processChat = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      responseId: z.uuid(),
    }),
  )
  .handler(async ({ input, context }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к workspace" });
    }

    const response = await context.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, input.responseId),
        eq(responseTable.entityType, "gig"),
      ),
    });

    if (!response) {
      throw new ORPCError("NOT_FOUND", { message: "Отклик не найден" });
    }

    const gigRecord = await context.db.query.gig.findFirst({
      where: and(
        eq(gig.id, response.entityId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!gigRecord) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этому отклику",
      });
    }

    if (response.importSource !== "KWORK") {
      throw new ORPCError("BAD_REQUEST", { message: "Отклик не с Kwork" });
    }

    const profileData = response.profileData as
      | { kworkWorkerId?: number }
      | null
      | undefined;
    if (!profileData?.kworkWorkerId) {
      throw new ORPCError("BAD_REQUEST", {
        message: "У отклика нет Kwork worker ID",
      });
    }

    await inngest.send({
      name: "kwork-chat/process",
      data: {
        responseId: input.responseId,
        workspaceId: input.workspaceId,
      },
    });

    return { success: true, message: "Обработка чата запущена" };
  });
