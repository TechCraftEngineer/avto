import { eq } from "@qbs-autonaim/db";
import { vacancy } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { createErrorHandler } from "../../../utils/error-handler";

const updateVacancyFavoriteInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  vacancyId: z.string().uuid(),
  isFavorite: z.boolean(),
});

export const updateVacancyFavorite = protectedProcedure
  .input(updateVacancyFavoriteInputSchema)
  .handler(async ({ input, context }) => {
    const errorHandler = createErrorHandler(
      context.auditLogger,
      context.session.user.id,
      context.ipAddress,
      context.userAgent,
    );

    try {
      // Проверка доступа к workspace
      const access = await context.workspaceRepository.checkAccess(
        input.workspaceId,
        context.session.user.id,
      );

      if (!access) {
        throw await errorHandler.handleAuthorizationError("workspace", {
          workspaceId: input.workspaceId,
          userId: context.session.user.id,
        });
      }

      // Обновление статуса избранного
      const updatedVacancy = await context.db
        .update(vacancy)
        .set({ isFavorite: input.isFavorite })
        .where(eq(vacancy.id, input.vacancyId))
        .returning({ id: vacancy.id, isFavorite: vacancy.isFavorite });

      if (updatedVacancy.length === 0) {
        throw new Error("Vacancy not found");
      }

      return updatedVacancy[0];
    } catch (error) {
      if (error instanceof Error && error.message.includes("TRPC")) {
        throw error;
      }
      throw await errorHandler.handleDatabaseError(error as Error, {
        workspaceId: input.workspaceId,
        vacancyId: input.vacancyId,
        operation: "update_vacancy_favorite",
      });
    }
  });
