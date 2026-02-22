import { ORPCError } from "@orpc/server";
import { interviewScenario } from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const create = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      questions: z.array(z.string()).optional(),
      settings: z.record(z.string(), z.unknown()).optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const { workspaceId, ...data } = input;

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

    // Создаем сценарий интервью
    const result = await context.db
      .insert(interviewScenario)
      .values({
        ...data,
        workspaceId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!result[0]) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Не удалось создать сценарий интервью",
      });
    }

    return result[0];
  });
