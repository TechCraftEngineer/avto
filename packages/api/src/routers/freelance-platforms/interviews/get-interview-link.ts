import { and, eq } from "@qbs-autonaim/db";
import { interviewLink, vacancy } from "@qbs-autonaim/db/schema";
import { getInterviewUrlFromDb } from "@qbs-autonaim/server-utils";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

const getInterviewLinkInputSchema = z.object({
  vacancyId: z.uuid(),
  workspaceId: workspaceIdSchema,
});

export const getInterviewLink = protectedProcedure
  .input(getInterviewLinkInputSchema)
  .handler(async ({ input, context }) => {
    // Проверка доступа к workspace
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к этому workspace", });
    }

    // Проверяем, существует ли вакансия и принадлежит ли она workspace
    const vacancyData = await context.db.query.vacancy.findFirst({
      where: and(
        eq(vacancy.id, input.vacancyId),
        eq(vacancy.workspaceId, input.workspaceId),
      ),
    });

    if (!vacancyData) {
      throw new ORPCError("NOT_FOUND", { message: "Вакансия не найдена", });
    }

    // Получаем активную ссылку на интервью
    const activeInterviewLink = await context.db.query.interviewLink.findFirst({
      where: and(
        eq(interviewLink.entityType, "vacancy"),
        eq(interviewLink.entityId, input.vacancyId),
        eq(interviewLink.isActive, true),
      ),
    });

    if (!activeInterviewLink) {
      throw new ORPCError("NOT_FOUND", { message: "Ссылка на интервью не найдена для этой вакансии", });
    }

    const url = await getInterviewUrlFromDb(
      activeInterviewLink.token,
      input.workspaceId,
    );

    return {
      id: activeInterviewLink.id,
      vacancyId: activeInterviewLink.entityId,
      token: activeInterviewLink.token,
      url,
      isActive: activeInterviewLink.isActive,
      createdAt: activeInterviewLink.createdAt,
      expiresAt: activeInterviewLink.expiresAt,
    };
  });
