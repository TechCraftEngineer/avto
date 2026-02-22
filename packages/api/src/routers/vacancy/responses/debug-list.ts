import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import { response as responseTable, vacancy } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

/**
 * Временный debug endpoint для диагностики проблем с откликами
 */
export const debugList = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      vacancyId: z.string(),
    }),
  )
  .handler(async ({ context, input }) => {
    const { workspaceId, vacancyId } = input;

    // Проверка доступа к workspace
    const access = await context.workspaceRepository.checkAccess(
      workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этому workspace",
      });
    }

    // Проверка принадлежности вакансии к workspace
    const vacancyCheck = await context.db.query.vacancy.findFirst({
      where: and(
        eq(vacancy.id, vacancyId),
        eq(vacancy.workspaceId, workspaceId),
      ),
    });

    if (!vacancyCheck) {
      throw new ORPCError("NOT_FOUND", { message: "Вакансия не найдена" });
    }

    // Получаем все отклики без фильтров
    const allResponses = await context.db
      .select({
        id: responseTable.id,
        entityType: responseTable.entityType,
        entityId: responseTable.entityId,
        candidateName: responseTable.candidateName,
        status: responseTable.status,
        createdAt: responseTable.createdAt,
      })
      .from(responseTable);

    // Фильтруем отклики для этой вакансии
    const vacancyResponses = allResponses.filter(
      (r) => r.entityType === "vacancy" && r.entityId === vacancyId,
    );

    // Получаем отклики через query builder
    const responsesViaQuery = await context.db.query.response.findMany({
      where: and(
        eq(responseTable.entityType, "vacancy"),
        eq(responseTable.entityId, vacancyId),
      ),
      columns: {
        id: true,
        entityType: true,
        entityId: true,
        candidateName: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      debug: {
        vacancyId,
        workspaceId,
        vacancyExists: !!vacancyCheck,
        totalResponsesInDb: allResponses.length,
        responsesForThisVacancy: vacancyResponses.length,
        responsesViaQuery: responsesViaQuery.length,
      },
      allResponses: allResponses.slice(0, 10), // Первые 10 для проверки
      vacancyResponses: vacancyResponses.slice(0, 10),
      responsesViaQuery: responsesViaQuery.slice(0, 10),
    };
  });
