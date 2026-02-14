import { and, eq } from "@qbs-autonaim/db";
import {
  gig,
  interviewSession,
  response as responseTable,
} from "@qbs-autonaim/db/schema";
import { inngest } from "@qbs-autonaim/jobs/client";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const evaluate = protectedProcedure
  .input(
    z.object({
      responseId: z.string().uuid(),
      workspaceId: workspaceIdSchema,
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    const response = await ctx.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, input.responseId),
        eq(responseTable.entityType, "gig"),
      ),
    });

    if (!response) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Отклик не найден",
      });
    }

    const existingGig = await ctx.db.query.gig.findFirst({
      where: and(
        eq(gig.id, response.entityId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!existingGig) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому отклику",
      });
    }

    const sessionData = await ctx.db.query.interviewSession.findFirst({
      where: eq(interviewSession.responseId, input.responseId),
    });

    if (!sessionData) {
      throw new TRPCError({
        code: "NOT_FOUND",
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
        message: "Оценка запущена",
      };
    } catch (error) {
      console.error("Ошибка отправки события оценки:", {
        error,
        responseId: input.responseId,
        workspaceId: input.workspaceId,
        sessionId: sessionData.id,
      });

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось запустить оценку",
      });
    }
  });
