import { DraftService } from "../../services/draft.service";
import { protectedProcedure } from "../../orpc";

/**
 * Удалить черновик вакансии текущего пользователя
 *
 * Требования: 2.4, 5.1, 5.4, 10.1
 * Свойство 5: Замена черновика при создании нового
 * Свойство 11: Очистка черновика после создания вакансии
 */
export const deleteDraft = protectedProcedure.handler(async ({ context }) => {
  const draftService = new DraftService(context.db);
  await draftService.deleteDraft(context.session.user.id);

  return { success: true };
});
