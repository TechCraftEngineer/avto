import { UpdateDraftInputSchema } from "@qbs-autonaim/shared";
import { TRPCError } from "@trpc/server";
import { DraftService } from "../../services/draft.service";
import { protectedProcedure } from "../../trpc";

/**
 * Обновить существующий черновик вакансии
 * Использует retry логику с экспоненциальной задержкой (3 попытки)
 *
 * Требования: 1.2, 1.3, 1.4, 8.1, 10.1
 * Свойство 2: Автоматическое сохранение изменений
 * Свойство 3: Retry логика при ошибках
 */
export const update = protectedProcedure
  .input(UpdateDraftInputSchema)
  .mutation(async ({ ctx, input }) => {
    const draftService = new DraftService(ctx.db);

    try {
      return await draftService.updateDraft(ctx.session.user.id, input);
    } catch (error) {
      // Если черновик не найден
      if (error instanceof Error && error.message === "Черновик не найден") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Черновик не найден",
        });
      }

      // Другие ошибки
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          "Не удалось сохранить изменения. Проверьте подключение к интернету",
      });
    }
  });
