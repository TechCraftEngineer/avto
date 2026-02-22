import { DraftService } from "../../services/draft.service";
import { protectedProcedure } from "../../orpc";

/**
 * Получить активный черновик текущего пользователя
 *
 * Требования: 2.1, 3.2, 10.1
 * Свойство 4: Восстановление черновика при возврате
 */
export const getCurrent = protectedProcedure.query(async ({ ctx }) => {
  const draftService = new DraftService(ctx.db);
  return await draftService.getCurrentDraft(ctx.session.user.id);
});
