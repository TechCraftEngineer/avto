import { and, eq } from "@qbs-autonaim/db";
import { response as responseTable, vacancy } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

const deleteVacancyInputSchema = z.object({
  vacancyId: z.uuid(),
  workspaceId: workspaceIdSchema,
  dataCleanupOption: z.enum(["anonymize", "delete"]),
});

export const deleteVacancy = protectedProcedure
  .input(deleteVacancyInputSchema)
  .mutation(async ({ input, ctx }) => {
    // Проверка доступа к workspace
    const hasAccess = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    // Проверка существования вакансии
    const existingVacancy = await ctx.db.query.vacancy.findFirst({
      where: and(
        eq(vacancy.id, input.vacancyId),
        eq(vacancy.workspaceId, input.workspaceId),
      ),
    });

    if (!existingVacancy) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    // Выполняем удаление в зависимости от выбора пользователя
    if (input.dataCleanupOption === "anonymize") {
      try {
        await ctx.db.transaction(async (tx) => {
          // Анонимизируем персональные данные кандидатов
          await tx
            .update(responseTable)
            .set({
              candidateName: "Анонимный кандидат",
              telegramUsername: null,
              chatId: null,
              phone: null,
              contacts: null,
              coverLetter: "Данные анонимизированы",
              profileUrl: null,
              resumePdfFileId: null,
              experience: null,
              salaryExpectationsAmount: null,
            })
            .where(
              and(
                eq(responseTable.entityType, "vacancy"),
                eq(responseTable.entityId, input.vacancyId),
              ),
            );

          // Помечаем вакансию как неактивную
          await tx
            .update(vacancy)
            .set({
              isActive: false,
              updatedAt: new Date(),
            })
            .where(eq(vacancy.id, input.vacancyId));
        });

        return {
          success: true,
          message: "Вакансия архивирована, данные кандидатов анонимизированы",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Ошибка при анонимизации данных вакансии",
          cause: error,
        });
      }
    }

    // Полное удаление вакансии
    await ctx.db.transaction(async (tx) => {
      // Удаляем отклики вакансии (полиморфная связь не поддерживает CASCADE)
      await tx
        .delete(responseTable)
        .where(
          and(
            eq(responseTable.entityType, "vacancy"),
            eq(responseTable.entityId, input.vacancyId),
          ),
        );

      // Удаляем вакансию
      await tx
        .delete(vacancy)
        .where(
          and(
            eq(vacancy.id, input.vacancyId),
            eq(vacancy.workspaceId, input.workspaceId),
          ),
        );
    });

    return {
      success: true,
      message: "Вакансия и все связанные данные удалены",
    };
  });
