import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import {
  interviewScenario,
  UpdateInterviewScenarioSchema,
} from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const update = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      workspaceId: z.string(),
      data: UpdateInterviewScenarioSchema,
    }),
  )
  .handler(async ({ input, context }) => {
    const { id, workspaceId, data } = input;

    // Проверяем доступ к workspace
    const hasAccess = await context.workspaceRepository.checkAccess(
      workspaceId,
      context.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к workspace",
      });
    }

    // Проверяем существование сценария
    const scenario = await context.db.query.interviewScenario.findFirst({
      where: and(
        eq(interviewScenario.id, id),
        eq(interviewScenario.workspaceId, workspaceId),
        eq(interviewScenario.isActive, true),
      ),
    });

    if (!scenario) {
      throw new ORPCError("NOT_FOUND", {
        message: "Сценарий не найден",
      });
    }

    // Обновляем сценарий
    const updatedScenario = await context.db
      .update(interviewScenario)
      .set(data)
      .where(eq(interviewScenario.id, id))
      .returning();

    if (!updatedScenario[0]) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Не удалось обновить сценарий",
      });
    }

    return updatedScenario[0];
  });
