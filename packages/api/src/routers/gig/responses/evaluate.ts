import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import {
  gig,
  interviewSession,
  response as responseTable,
} from "@qbs-autonaim/db/schema";
import { inngest } from "@qbs-autonaim/jobs/client";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const evaluate = protectedProcedure
  .input(
    z.object({
      responseId: z.string().uuid(),
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

    const response = await context.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, input.responseId),
        eq(responseTable.entityType, "gig"),
      ),
    });

    if (!response) {
      throw new ORPCError("NOT_FOUND", { message: "Отклик не найден" });
    }

    const existingGig = await context.db.query.gig.findFirst({
      where: and(
        eq(gig.id, response.entityId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!existingGig) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этому проекту",
      });
    }

    const sessionData = await context.db.query.interviewSession.findFirst({
      where: eq(interviewSession.responseId, input.responseId),
    });

    if (!sessionData) {
      throw new ORPCError("NOT_FOUND", {
        message: "Сессия интервью не найдена для этого отклика",
      });
    }

    try {
      await inngest.send({
        name: "gig/response.evaluate",
        data: {
          responseId: input.responseId,
          workspaceId: input.workspaceId,
          chatSessionId: sessionData.id,
        },
      });

      return {
        success: true,
        message: "Оценка сохранена",
      };
    } catch (error) {
      console.error("Ошибка сохранения оценки отклика:", {
        error,
        responseId: input.responseId,
        workspaceId: input.workspaceId,
        sessionId: sessionData.id,
      });

      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Не удалось сохранить оценку",
      });
    }
  });
