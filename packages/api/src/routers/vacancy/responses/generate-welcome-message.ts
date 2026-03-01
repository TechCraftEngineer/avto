import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import {
  response as responseTable,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db/schema";
import { generateWelcomeMessage } from "@qbs-autonaim/jobs/services/messaging";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { verifyWorkspaceAccess } from "../../../utils/verify-workspace-access";

export const generateWelcomeMessageProcedure = protectedProcedure
  .input(
    z.object({
      responseId: z.string(),
      workspaceId: workspaceIdSchema,
    }),
  )
  .handler(async ({ context, input }) => {
    const { responseId, workspaceId } = input;

    await verifyWorkspaceAccess(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
    );

    const response = await context.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, responseId),
        eq(responseTable.entityType, "vacancy"),
      ),
    });

    if (!response) {
      throw new ORPCError("NOT_FOUND", { message: "Отклик не найден" });
    }

    const vacancy = await context.db.query.vacancy.findFirst({
      where: eq(vacancyTable.id, response.entityId),
      columns: { workspaceId: true },
    });

    if (!vacancy) {
      throw new ORPCError("NOT_FOUND", { message: "Вакансия не найдена" });
    }

    if (vacancy.workspaceId !== workspaceId) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этому отклику",
      });
    }

    const result = await generateWelcomeMessage(responseId, "hh");

    if (!result.success) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: result.error || "Не удалось сгенерировать приветствие",
      });
    }

    return { message: result.data };
  });
