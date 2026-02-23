import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import { response as responseTable, vacancy } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { ensureFound } from "../../../utils/ensure-found";
import { verifyWorkspaceAccess } from "../../../utils/verify-workspace-access";

const deleteVacancyInputSchema = z.object({
  vacancyId: z.uuid(),
  workspaceId: workspaceIdSchema,
  dataCleanupOption: z.enum(["anonymize", "delete"]),
});

export const deleteVacancy = protectedProcedure
  .input(deleteVacancyInputSchema)
  .handler(async ({ input, context }) => {
    await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.workspaceId,
      context.session.user.id,
    );

    ensureFound(
      await context.db.query.vacancy.findFirst({
        where: and(
          eq(vacancy.id, input.vacancyId),
          eq(vacancy.workspaceId, input.workspaceId),
        ),
      }),
      "Вакансия не найдена",
    );

    // Выполняем удаление в зависимости от выбора пользователя
    if (input.dataCleanupOption === "anonymize") {
      try {
        await context.db.transaction(async (tx) => {
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
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Ошибка при анонимизации данных вакансии",
          cause: error,
        });
      }
    }

    // Полное удаление вакансии
    await context.db.transaction(async (tx) => {
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
