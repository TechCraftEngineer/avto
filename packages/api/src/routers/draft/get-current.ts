import { DraftService } from "../../services/draft.service";
import { protectedProcedure } from "../../orpc";

/**
 * Получить активный черновик текущего пользователя
 *
 * Требования: 2.1, 3.2, 10.1
 * Свойство 4: Восстановление черновика при возврате
 */
export const getCurrent = protectedProcedure.handler(async ({ context }) => {
  const draftService = new DraftService(context.db);
  return await draftService.getCurrentDraft(context.session.user.id);
});
