import { ORPCError } from "@orpc/server";
import { UpdateDraftInputSchema } from "@qbs-autonaim/shared";
import { protectedProcedure } from "../../orpc";
import { DraftService } from "../../services/draft.service";

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
  .handler(async ({ context, input }) => {
    const draftService = new DraftService(context.db);

    try {
      return await draftService.updateDraft(context.session.user.id, input);
    } catch (error) {
      // Если черновик не найден
      if (error instanceof Error && error.message === "Черновик не найден") {
        throw new ORPCError("NOT_FOUND", { message: "Черновик не найден" });
      }

      // Другие ошибки
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message:
          "Не удалось сохранить изменения. Проверьте подключение к интернету",
      });
    }
  });
