import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import {
  interviewSession,
  response as responseTable,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db/schema";
import { inngest } from "@qbs-autonaim/jobs/client";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { verifyWorkspaceAccess } from "../../../utils/verify-workspace-access";

export const sendWelcome = protectedProcedure
  .input(
    z.object({
      responseId: z.string(),
      username: z.string(),
      workspaceId: workspaceIdSchema,
    }),
  )
  .handler(async ({ context, input }) => {
    const { responseId, username, workspaceId } = input;

    await verifyWorkspaceAccess(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
    );

    // Проверка отклика
    const response = await context.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, responseId),
        eq(responseTable.entityType, "vacancy"),
      ),
    });

    if (!response) {
      throw new ORPCError("NOT_FOUND", { message: "Отклик не найден" });
    }

    // Query vacancy separately to check workspace access
    const vacancy = await context.db.query.vacancy.findFirst({
      where: eq(vacancyTable.id, response.entityId),
      columns: { workspaceId: true },
    });

    if (!vacancy) {
      throw new ORPCError("NOT_FOUND", { message: "Вакансия не найдена" });
    }

    // Проверка принадлежности вакансии к рабочему пространству
    if (vacancy.workspaceId !== workspaceId) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этому отклику",
      });
    }

    // Очистка имя пользователя interviewSession
    const cleanUsername = username.startsWith("@")
      ? username.substring(1)
      : username;

    // Проверяем существующий interviewSession
    const existingSession = await context.db.query.interviewSession.findFirst({
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

      // Обновляем существующий session
      await context.db
        .update(interviewSession)
        .set({
          status: "active",
          lastChannel: "telegram",
          metadata: updatedMetadata,
        })
        .where(eq(interviewSession.id, existingSession.id));
    } else {
      // Создаём новый interviewSession
      await context.db.insert(interviewSession).values({
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
      message: "Приветственное сообщение отправляется",
    };
  });
