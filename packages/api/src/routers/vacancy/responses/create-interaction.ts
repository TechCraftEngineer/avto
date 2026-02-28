import { ORPCError } from "@orpc/server";
import { eq } from "@qbs-autonaim/db";
import {
  gig as gigTable,
  interactionChannelValues,
  responseInteractionLog,
  response as responseTable,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

const manualInteractionTypes = [
  "call",
  "email_sent",
  "meeting",
  "message_sent",
  "note",
  "followup_sent",
] as const;

export const createInteraction = protectedProcedure
  .input(
    z.object({
      responseId: z.uuid(),
      workspaceId: workspaceIdSchema,
      interactionType: z.enum(manualInteractionTypes),
      happenedAt: z.coerce.date(),
      channel: z.enum(interactionChannelValues).optional().nullable(),
      note: z.string().max(2000).optional().nullable(),
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
      where: eq(responseTable.id, input.responseId),
    });

    if (!response) {
      throw new ORPCError("NOT_FOUND", { message: "Отклик не найден" });
    }

    let entityWorkspaceId: string | null = null;

    if (response.entityType === "vacancy") {
      const vacancy = await context.db.query.vacancy.findFirst({
        where: eq(vacancyTable.id, response.entityId),
        columns: { workspaceId: true },
      });
      if (!vacancy) {
        throw new ORPCError("NOT_FOUND", {
          message: "Вакансия не найдена",
        });
      }
      entityWorkspaceId = vacancy.workspaceId;
    } else if (response.entityType === "gig") {
      const gig = await context.db.query.gig.findFirst({
        where: eq(gigTable.id, response.entityId),
        columns: { workspaceId: true },
      });
      if (!gig) {
        throw new ORPCError("NOT_FOUND", {
          message: "Гиг не найден",
        });
      }
      entityWorkspaceId = gig.workspaceId;
    } else {
      throw new ORPCError("BAD_REQUEST", {
        message: `Ручные взаимодействия для типа "${response.entityType}" пока не поддерживаются`,
      });
    }

    if (entityWorkspaceId !== input.workspaceId) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этому отклику",
      });
    }

    if (input.happenedAt > new Date()) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Дата взаимодействия не может быть в будущем",
      });
    }

    const [record] = await context.db
      .insert(responseInteractionLog)
      .values({
        responseId: input.responseId,
        interactionType: input.interactionType,
        source: "manual",
        happenedAt: input.happenedAt,
        createdByUserId: context.session.user.id,
        channel: input.channel ?? null,
        note: input.note ?? null,
      })
      .returning();

    if (!record) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Не удалось создать запись взаимодействия",
      });
    }

    return record;
  });
