import { integration, vacancyPublication } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

const getVacancyIntegrationsInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  vacancyId: z.string().uuid(),
});

export const getVacancyIntegrations = protectedProcedure
  .input(getVacancyIntegrationsInputSchema)
  .query(async ({ input, ctx }) => {
    // Проверка доступа к workspace
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new Error("Нет доступа к этому workspace");
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

    // Получаем публикации вакансии
    const publications = await ctx.db.query.vacancyPublication.findMany({
      where: (table, { eq: eqFn }) => eqFn(table.vacancyId, input.vacancyId),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    });

    return {
      activeIntegrations,
      publications,
    };
  });
