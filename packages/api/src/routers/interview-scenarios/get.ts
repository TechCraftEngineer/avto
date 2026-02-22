import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import { interviewScenario } from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const get = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      workspaceId: z.string(),
    }),
  )
  .handler(async ({ input, context }) => {
    const { id, workspaceId } = input;

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

    // Получаем сценарий
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

    return scenario;
  });
