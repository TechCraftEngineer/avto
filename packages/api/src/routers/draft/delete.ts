import { DraftService } from "../../services/draft.service";
import { protectedProcedure } from "../../trpc";

/**
 * Удалить черновик вакансии текущего пользователя
 *
 * Требования: 2.4, 5.1, 5.4, 10.1
 * Свойство 5: Замена черновика при создании нового
 * Свойство 11: Очистка черновика после создания вакансии
 */
export const deleteDraft = protectedProcedure.mutation(async ({ ctx }) => {
  const draftService = new DraftService(ctx.db);
  await draftService.deleteDraft(ctx.session.user.id);

  return { success: true };
});
