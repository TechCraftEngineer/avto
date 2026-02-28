import { ORPCError } from "@orpc/server";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

const getVacancyIntegrationsInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  vacancyId: z.uuid(),
});

export const getVacancyIntegrations = protectedProcedure
  .input(getVacancyIntegrationsInputSchema)
  .handler(async ({ input, context }) => {
    // Проверка доступа к workspace
    await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    // Проверка, что вакансия принадлежит workspace
    const vacancy = await context.db.query.vacancy.findFirst({
      where: (table, { eq: eqFn }) => eqFn(table.id, input.vacancyId),
      columns: {
        workspaceId: true,
      },
    });

    if (!vacancy) {
      throw new ORPCError("NOT_FOUND", { message: "Вакансия не найдена" });
    }

    if (vacancy.workspaceId !== input.workspaceId) {
      throw new ORPCError("FORBIDDEN", {
        message: "Вакансия не принадлежит указанному workspace",
      });
    }

    // Получаем активные интеграции для workspace
    const activeIntegrations = await context.db.query.integration.findMany({
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
    const publications = await context.db.query.vacancyPublication.findMany({
      where: (table, { eq: eqFn }) => eqFn(table.vacancyId, input.vacancyId),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    });

    return {
      activeIntegrations,
      publications,
    };
  });
