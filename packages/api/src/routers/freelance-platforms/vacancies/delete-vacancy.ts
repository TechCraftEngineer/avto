import { and, eq } from "@qbs-autonaim/db";
import { response, vacancy } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { createErrorHandler } from "../../../utils/error-handler";

const deleteVacancyInputSchema = z.object({
  vacancyId: z.uuid(),
  workspaceId: workspaceIdSchema,
});

export const deleteVacancy = protectedProcedure
  .input(deleteVacancyInputSchema)
  .mutation(async ({ input, ctx }) => {
    const errorHandler = createErrorHandler(
      ctx.auditLogger,
      ctx.session.user.id,
      ctx.ipAddress,
      ctx.userAgent,
    );

    try {
      // Проверяем доступ к workspace
      const hasAccess = await ctx.workspaceRepository.checkAccess(
        input.workspaceId,
        ctx.session.user.id,
      );

      if (!hasAccess) {
        throw await errorHandler.handleAuthorizationError("workspace", {
          workspaceId: input.workspaceId,
          userId: ctx.session.user.id,
        });
      }

      // Проверяем существование вакансии и принадлежность к workspace
      const existingVacancy = await ctx.db.query.vacancy.findFirst({
        where: (vacancy, { eq, and }) =>
          and(
            eq(vacancy.id, input.vacancyId),
            eq(vacancy.workspaceId, input.workspaceId),
          ),
      });

      if (!existingVacancy) {
        throw await errorHandler.handleNotFoundError("Вакансия", {
          vacancyId: input.vacancyId,
          workspaceId: input.workspaceId,
        });
      }

      // Логируем удаление перед фактическим удалением
      await ctx.auditLogger.logVacancyDeletion({
        userId: ctx.session.user.id,
        vacancyId: input.vacancyId,
        deletionType: "delete",
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      // Удаляем отклики вакансии (полиморфная связь не поддерживает CASCADE)
      await ctx.db
        .delete(response)
        .where(
          and(
            eq(response.entityType, "vacancy"),
            eq(response.entityId, input.vacancyId),
          ),
        );

      // Удаляем вакансию
      await ctx.db.delete(vacancy).where(eq(vacancy.id, input.vacancyId));

      return {
        success: true,
        message: "Вакансия и все связанные данные удалены",
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("TRPC")) {
        throw error;
      }
      throw await errorHandler.handleDatabaseError(error as Error, {
        vacancyId: input.vacancyId,
        operation: "delete_vacancy",
      });
    }
  });
