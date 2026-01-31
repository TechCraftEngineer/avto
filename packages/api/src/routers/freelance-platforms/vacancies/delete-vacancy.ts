import { and, eq } from "@qbs-autonaim/db";
import { response as responseTable, vacancy } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";
import { createErrorHandler } from "../../../utils/error-handler";

const deleteVacancyInputSchema = z.object({
  vacancyId: z.uuid(),
  workspaceId: workspaceIdSchema,
  dataCleanupOption: z.enum(["anonymize", "delete"]),
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

      // Выполняем очистку данных в зависимости от выбора пользователя
      if (input.dataCleanupOption === "anonymize") {
        // Анонимизируем персональные данные фрилансеров
        await ctx.db
          .update(responseTable)
          .set({
            candidateName: "Анонимный кандидат",
            telegramUsername: null,
            chatId: null,
            phone: null,
            contacts: null,
            coverLetter: "Данные анонимизированы",
            profileUrl: null,
          })
          .where(
            and(
              eq(responseTable.entityId, input.vacancyId),
              eq(responseTable.entityType, "vacancy"),
            ),
          );

        // Помечаем вакансию как неактивную (soft delete)
        await ctx.db
          .update(vacancy)
          .set({
            isActive: false,
          })
          .where(eq(vacancy.id, input.vacancyId));

        // Логируем анонимизацию
        await ctx.auditLogger.logVacancyDeletion({
          userId: ctx.session.user.id,
          vacancyId: input.vacancyId,
          deletionType: "anonymize",
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
        });

        return {
          success: true,
          message: "Вакансия архивирована, данные фрилансеров анонимизированы",
        };
      } else {
        // Логируем удаление перед фактическим удалением
        await ctx.auditLogger.logVacancyDeletion({
          userId: ctx.session.user.id,
          vacancyId: input.vacancyId,
          deletionType: "delete",
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
        });

        // Удаляем вакансию (каскадное удаление удалит и отклики)
        await ctx.db.delete(vacancy).where(eq(vacancy.id, input.vacancyId));

        return {
          success: true,
          message: "Вакансия и все связанные данные удалены",
        };
      }
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
