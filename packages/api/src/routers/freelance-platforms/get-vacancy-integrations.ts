import { integration, vacancyPublication } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";

const getVacancyIntegrationsInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  vacancyId: z.string().uuid(),
});

export const getVacancyIntegrations = protectedProcedure
  .input(getVacancyIntegrationsInputSchema)
  .query(async ({ input, ctx }) => {
    // Проверка доступа к workspace
    await ctx.workspaceRepository.checkAccess(input.workspaceId, ctx.session.user.id);

    // Проверка, что вакансия принадлежит workspace
    const vacancy = await ctx.db.query.vacancy.findFirst({
      where: (table, { eq: eqFn }) => eqFn(table.id, input.vacancyId),
      columns: {
        workspaceId: true,
      },
    });

    if (!vacancy) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    if (vacancy.workspaceId !== input.workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Вакансия не принадлежит указанному workspace",
      });
    }

    // Получаем активные интеграции для workspace
    const activeIntegrations = await ctx.db.query.integration.findMany({
      where: (table, { eq: eqFn, and }) =>
        and(
          eqFn(table.workspaceId, input.workspaceId),
          eqFn(table.isActive, true),
        ),
      columns: {
        id: true,
        type: true,
        name: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    // Получаем публикации вакансии (с дополнительной проверкой workspace)
    const publications = await ctx.db.query.vacancyPublication.findMany({
      where: (table, { eq: eqFn, and }) =>
        and(
          eqFn(table.vacancyId, input.vacancyId),
          // Дополнительная проверка через join с vacancy
          eqFn(table.vacancy.workspaceId, input.workspaceId),
        ),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    });

    return {
      activeIntegrations,
      publications,
    };
  });
