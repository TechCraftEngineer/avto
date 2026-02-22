
import { create } from "./create";
import { deleteDraft } from "./delete";
import { getCurrent } from "./get-current";
import { update } from "./update";

/**
 * tRPC router для работы с черновиками вакансий
 *
 * Обеспечивает автоматическое сохранение прогресса создания вакансии через AI-бота
 * и восстановление данных при возвращении пользователя.
 *
 * Требования: 8.3, 10.1
 */
export const draftRouter = {
  getCurrent,
  create,
  update,
  delete: deleteDraft,
};
