import { CreateDraftInputSchema } from "@qbs-autonaim/shared";
import { DraftService } from "../../services/draft.service";
import { protectedProcedure } from "../../orpc";

/**
 * Создать новый черновик вакансии
 * Автоматически удаляет существующий черновик пользователя
 *
 * Требования: 1.1, 3.3, 10.1
 * Свойство 1: Создание черновика при начале работы
 * Свойство 7: Уникальность черновика по пользователю
 */
export const create = protectedProcedure
  .input(CreateDraftInputSchema)
  .mutation(async ({ ctx, input }) => {
    const draftService = new DraftService(ctx.db);
    return await draftService.createDraft(ctx.session.user.id, input);
  });
