import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import {
  responseHistory,
  response as responseTable,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db/schema";
import { getResponseEventTitle } from "@qbs-autonaim/shared";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const listActivities = protectedProcedure
  .input(
    z.object({
      candidateId: uuidv7Schema,
      workspaceId: workspaceIdSchema,
    }),
  )
  .handler(async ({ input, context }) => {
    const { candidateId, workspaceId } = input;

    // Проверяем существование отклика и доступ к workspace
    const response = await context.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, candidateId),
        eq(responseTable.entityType, "vacancy"),
      ),
    });

    if (!response) {
      throw new ORPCError("NOT_FOUND", { message: "Кандидат не найден" });
    }

    // Query vacancy separately using entityId
    const vacancy = await context.db.query.vacancy.findFirst({
      where: eq(vacancyTable.id, response.entityId),
      columns: {
        workspaceId: true,
      },
    });

    if (!vacancy) {
      throw new ORPCError("NOT_FOUND", {
        message: "Вакансия для этого кандидата не найдена",
      });
    }

    if (vacancy.workspaceId !== workspaceId) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этому кандидату",
      });
    }

    // Получаем историю активностей
    const activities = await context.db.query.responseHistory.findMany({
      where: eq(responseHistory.responseId, candidateId),
      with: {
        user: true,
      },
      orderBy: (history, { desc }) => [desc(history.createdAt)],
    });

    // Форматируем активности
    return activities.map((activity) => {
      // Используем универсальную функцию для получения описания
      let description = getResponseEventTitle(
        activity.eventType,
        activity.newValue,
      );

      // Добавляем детали для комментариев
      if (activity.eventType === "COMMENT_ADDED" && activity.metadata) {
        const comment = (activity.metadata as { comment?: string }).comment;
        if (comment) {
          description = `Добавлен комментарий: "${comment.substring(0, 100)}${comment.length > 100 ? "…" : ""}"`;
        }
      }

      return {
        id: activity.id,
        type: activity.eventType,
        description,
        author: activity.user?.name || null,
        authorAvatar: activity.user?.image || null,
        createdAt: activity.createdAt,
        metadata: activity.metadata,
      };
    });
  });
