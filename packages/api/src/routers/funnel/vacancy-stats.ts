import { and, eq, inArray } from "@qbs-autonaim/db";
import { response as responseTable, vacancy } from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import { mapResponseToStage } from "./map-response-stage";

export const vacancyStats = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      vacancyId: z.string().optional(),
    }),
  )
  .query(async ({ input, ctx }) => {
    const vacancies = await ctx.db.query.vacancy.findMany({
      where: eq(vacancy.workspaceId, input.workspaceId),
    });

    const workspaceVacancyIds = new Set(vacancies.map((v) => v.id));

    if (input.vacancyId && !workspaceVacancyIds.has(input.vacancyId)) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена в указанном workspace",
      });
    }

    const vacancyIds = input.vacancyId
      ? [input.vacancyId]
      : Array.from(workspaceVacancyIds);

    if (vacancyIds.length === 0) {
      return [];
    }

    const responses = await ctx.db.query.response.findMany({
      where: and(
        inArray(responseTable.entityId, vacancyIds),
        eq(responseTable.entityType, "vacancy"),
      ),
    });

    const statsByVacancy = new Map<
      string,
      {
        vacancyId: string;
        vacancyName: string;
        total: number;
        inProcess: number;
        hired: number;
        rejected: number;
      }
    >();

    for (const response of responses) {
      const vacancyData = vacancies.find((v) => v.id === response.entityId);
      const vacancyName = vacancyData?.title ?? "Неизвестная вакансия";

      const stage = mapResponseToStage(
        response.status,
        response.hrSelectionStatus,
      );
      const isHired = stage === "HIRED";
      const isRejected = stage === "REJECTED";

      const existing = statsByVacancy.get(response.entityId);

      if (existing) {
        existing.total++;
        if (isHired) {
          existing.hired++;
        } else if (isRejected) {
          existing.rejected++;
        } else {
          existing.inProcess++;
        }
      } else {
        statsByVacancy.set(response.entityId, {
          vacancyId: response.entityId,
          vacancyName,
          total: 1,
          inProcess: !isHired && !isRejected ? 1 : 0,
          hired: isHired ? 1 : 0,
          rejected: isRejected ? 1 : 0,
        });
      }
    }

    return Array.from(statsByVacancy.values()).sort(
      (a, b) => b.total - a.total,
    );
  });
