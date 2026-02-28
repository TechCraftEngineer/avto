import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import {
  gig as gigTable,
  pipelineStage,
  response as responseTable,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db/schema";
import { uuidv7Schema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const moveResponse = protectedProcedure
  .input(
    z.object({
      responseId: uuidv7Schema,
      pipelineStageId: uuidv7Schema,
    }),
  )
  .handler(async ({ input, context }) => {
    const response = await context.db.query.response.findFirst({
      where: eq(responseTable.id, input.responseId),
      columns: { id: true, entityType: true, entityId: true },
    });

    if (!response) {
      throw new ORPCError("NOT_FOUND", { message: "Отклик не найден" });
    }

    const stage = await context.db.query.pipelineStage.findFirst({
      where: eq(pipelineStage.id, input.pipelineStageId),
      columns: {
        id: true,
        workspaceId: true,
        entityType: true,
        entityId: true,
      },
    });

    if (!stage) {
      throw new ORPCError("NOT_FOUND", { message: "Этап не найден" });
    }

    let workspaceId: string;

    if (response.entityType === "vacancy") {
      const vacancy = await context.db.query.vacancy.findFirst({
        where: eq(vacancyTable.id, response.entityId),
        columns: { workspaceId: true },
      });
      if (!vacancy) {
        throw new ORPCError("NOT_FOUND", { message: "Вакансия не найдена" });
      }
      workspaceId = vacancy.workspaceId;
    } else if (response.entityType === "gig") {
      const gig = await context.db.query.gig.findFirst({
        where: eq(gigTable.id, response.entityId),
        columns: { workspaceId: true },
      });
      if (!gig) {
        throw new ORPCError("NOT_FOUND", { message: "Задание не найдено" });
      }
      workspaceId = gig.workspaceId;
    } else {
      throw new ORPCError("BAD_REQUEST", {
        message: "Перемещение откликов project не поддерживается",
      });
    }

    if (stage.workspaceId !== workspaceId) {
      throw new ORPCError("FORBIDDEN", {
        message: "Этап принадлежит другому workspace",
      });
    }

    if (stage.entityType !== response.entityType) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Тип этапа не совпадает с типом отклика",
      });
    }

    const access = await context.workspaceRepository.checkAccess(
      workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к workspace" });
    }

    await context.db
      .update(responseTable)
      .set({
        pipelineStageId: input.pipelineStageId,
        updatedAt: new Date(),
      })
      .where(eq(responseTable.id, input.responseId));

    return { success: true };
  });
