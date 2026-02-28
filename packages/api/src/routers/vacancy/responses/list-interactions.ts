import { ORPCError } from "@orpc/server";
import { desc, eq } from "@qbs-autonaim/db";
import {
  responseHistory,
  responseInteractionLog,
  response as responseTable,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const listInteractions = protectedProcedure
  .input(z.object({ responseId: z.uuid(), workspaceId: workspaceIdSchema }))
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
      where: eq(responseTable.id, input.responseId),
    });

    if (!response) {
      throw new ORPCError("NOT_FOUND", { message: "Отклик не найден" });
    }

    const vacancy = await context.db.query.vacancy.findFirst({
      where: eq(vacancyTable.id, response.entityId),
      columns: { workspaceId: true },
    });

    if (!vacancy) {
      throw new ORPCError("NOT_FOUND", { message: "Вакансия не найдена" });
    }

    if (vacancy.workspaceId !== input.workspaceId) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этому отклику",
      });
    }

    const [history, interactions] = await Promise.all([
      context.db.query.responseHistory.findMany({
        where: eq(responseHistory.responseId, input.responseId),
        orderBy: [desc(responseHistory.createdAt)],
        with: { user: true },
      }),
      context.db.query.responseInteractionLog.findMany({
        where: eq(responseInteractionLog.responseId, input.responseId),
        orderBy: [desc(responseInteractionLog.happenedAt)],
        with: { createdByUser: true },
      }),
    ]);

    const historyItems = history.map((h) => ({
      kind: "history" as const,
      id: h.id,
      timestamp: h.createdAt,
      eventType: h.eventType,
      userId: h.userId,
      oldValue: h.oldValue,
      newValue: h.newValue,
      metadata: h.metadata,
      user: h.user,
    }));

    const interactionItems = interactions.map((i) => ({
      kind: "interaction" as const,
      id: i.id,
      timestamp: i.happenedAt,
      eventType: i.interactionType,
      source: i.source,
      channel: i.channel,
      note: i.note,
      createdByUserId: i.createdByUserId,
      metadata: i.metadata,
      createdByUser: i.createdByUser,
    }));

    const merged = [...historyItems, ...interactionItems].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );

    return merged;
  });
