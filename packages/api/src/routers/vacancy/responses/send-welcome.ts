import { and, eq } from "@qbs-autonaim/db";
import {
  interviewSession,
  response as responseTable,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db/schema";
import { inngest } from "@qbs-autonaim/jobs/client";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const sendWelcome = protectedProcedure
  .input(
    z.object({
      responseId: z.string(),
      username: z.string(),
      workspaceId: workspaceIdSchema,
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { responseId, username, workspaceId } = input;

    // Проверка доступа к рабочему пространству
    const access = await ctx.workspaceRepository.checkAccess(
      workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому рабочему пространству",
      });
    }

    // Получаем данные отклика
    const response = await ctx.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, responseId),
        eq(responseTable.entityType, "vacancy"),
      ),
    });

    if (!response) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Отклик не найден",
      });
    }

    // Query vacancy separately to check workspace access
    const vacancy = await ctx.db.query.vacancy.findFirst({
      where: eq(vacancyTable.id, response.entityId),
      columns: { workspaceId: true },
    });

    if (!vacancy) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    // Проверка принадлежности вакансии к рабочему пространству
    if (vacancy.workspaceId !== workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому отклику",
      });
    }

    // Создаем или обновляем interviewSession
    const cleanUsername = username.startsWith("@")
      ? username.substring(1)
      : username;

    // Проверяем существующую interviewSession
    const existingSession = await ctx.db.query.interviewSession.findFirst({
      where: eq(interviewSession.responseId, responseId),
    });

    if (existingSession) {
      // Получаем существующие метаданные
      const existingMetadata: Record<string, unknown> =
        existingSession.metadata || {};

      // Объединяем с новыми данными
      const updatedMetadata = {
        ...existingMetadata,
        telegramUsername: cleanUsername,
        responseId,
        vacancyId: response.entityId,
      };

      // Обновляем существующую session
      await ctx.db
        .update(interviewSession)
        .set({
          status: "active",
          lastChannel: "telegram",
          metadata: updatedMetadata,
        })
        .where(eq(interviewSession.id, existingSession.id));
    } else {
      // Создаем новую interviewSession
      await ctx.db.insert(interviewSession).values({
        responseId: responseId,
        status: "active",
        lastChannel: "telegram",
        metadata: {
          telegramUsername: cleanUsername,
          responseId,
          vacancyId: response.entityId,
        },
      });
    }

    // Отправляем событие через Inngest клиент
    await inngest.send({
      name: "candidate/welcome",
      data: {
        responseId,
        username: cleanUsername,
      },
    });

    return {
      success: true,
      message: "Приветственное сообщение отправлено",
    };
  });
