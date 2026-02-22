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
  .handler(async ({ input, context }) => {
    const errorHandler = createErrorHandler(
      context.auditLogger,
      context.session.user.id,
      context.ipAddress,
      context.userAgent,
    );

    try {
      // Проверяем доступ к workspace
      const hasAccess = await context.workspaceRepository.checkAccess(
        input.workspaceId,
        context.session.user.id,
      );

      if (!hasAccess) {
        throw await errorHandler.handleAuthorizationError("workspace", {
          workspaceId: input.workspaceId,
          userId: context.session.user.id,
        });
      }

      // Проверяем существование вакансии и принадлежность к workspace
      const existingVacancy = await context.db.query.vacancy.findFirst({
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
      await context.auditLogger.logVacancyDeletion({
        userId: context.session.user.id,
        vacancyId: input.vacancyId,
        deletionType: "delete",
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      // Удаляем отклики вакансии (полиморфная связь не поддерживает CASCADE)
      await context.db
        .delete(response)
        .where(
          and(
            eq(response.entityType, "vacancy"),
            eq(response.entityId, input.vacancyId),
          ),
        );

      // Удаляем вакансию
      await context.db.delete(vacancy).where(eq(vacancy.id, input.vacancyId));

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
