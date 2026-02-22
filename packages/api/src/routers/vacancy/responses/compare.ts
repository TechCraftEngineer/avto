import { ORPCError } from "@orpc/server";
import { and, desc, eq, sql } from "@qbs-autonaim/db";
import {
  responseScreening,
  response as responseTable,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const compare = protectedProcedure
  .input(
    z.object({
      vacancyId: z.string().uuid(),
      workspaceId: workspaceIdSchema,
      limit: z.number().min(1).max(50).default(10),
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

    const vacancy = await context.db.query.vacancy.findFirst({
      where: eq(vacancyTable.id, input.vacancyId),
      columns: { workspaceId: true },
    });

    if (!vacancy) {
      throw new ORPCError("NOT_FOUND", { message: "Вакансия не найдена" });
    }

    if (vacancy.workspaceId !== input.workspaceId) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этой вакансии",
      });
    }

    // Получаем топ откликов по overallScore из responseScreening
    const topResponses = await context.db
      .select({
        id: responseTable.id,
        candidateName: responseTable.candidateName,
        overallScore: responseScreening.overallScore,
        skillsMatchScore: responseScreening.skillsMatchScore,
        experienceScore: responseScreening.experienceScore,
        salaryExpectationsAmount: responseTable.salaryExpectationsAmount,
        skills: responseTable.skills,
        status: responseTable.status,
        hrSelectionStatus: responseTable.hrSelectionStatus,
        createdAt: responseTable.createdAt,
      })
      .from(responseTable)
      .innerJoin(
        responseScreening,
        eq(responseTable.id, responseScreening.responseId),
      )
      .where(
        and(
          eq(responseTable.entityType, "vacancy"),
          eq(responseTable.entityId, input.vacancyId),
          sql`${responseScreening.overallScore} IS NOT NULL`,
        ),
      )
      .orderBy(desc(responseScreening.overallScore))
      .limit(input.limit);

    // Вычисляем статистику
    const stats = await context.db
      .select({
        avgScore: sql<number>`AVG(${responseScreening.overallScore})`,
        maxScore: sql<number>`MAX(${responseScreening.overallScore})`,
        minScore: sql<number>`MIN(${responseScreening.overallScore})`,
        totalCount: sql<number>`COUNT(*)`,
      })
      .from(responseTable)
      .innerJoin(
        responseScreening,
        eq(responseTable.id, responseScreening.responseId),
      )
      .where(
        and(
          eq(responseTable.entityType, "vacancy"),
          eq(responseTable.entityId, input.vacancyId),
          sql`${responseScreening.overallScore} IS NOT NULL`,
        ),
      );

    return {
      responses: topResponses,
      stats: stats[0] ?? {
        avgScore: 0,
        maxScore: 0,
        minScore: 0,
        totalCount: 0,
      },
    };
  });
