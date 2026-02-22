import { ORPCError } from "@orpc/server";
import { and, eq, sql } from "@qbs-autonaim/db";
import { gig, interviewScenario } from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const deleteItem = protectedProcedure
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

    // Проверяем, используется ли сценарий в каких-либо gig'ах
    const usedInGigsResult = await context.db
      .select({ count: sql<number>`count(*)` })
      .from(gig)
      .where(
        and(eq(gig.interviewScenarioId, id), eq(gig.workspaceId, workspaceId)),
      );

    const usedInGigs = usedInGigsResult[0]?.count ?? 0;

    if (usedInGigs > 0) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Невозможно удалить сценарий, который используется в заданиях",
      });
    }

    // Деактивируем сценарий вместо полного удаления
    await context.db
      .update(interviewScenario)
      .set({ isActive: false })
      .where(eq(interviewScenario.id, id));

    return { success: true };
  });
