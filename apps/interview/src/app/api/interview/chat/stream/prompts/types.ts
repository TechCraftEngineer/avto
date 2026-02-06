import type { StageId } from "../stages/types";
import type { GigLike, VacancyLike } from "../strategies/types";

/**
 * Интерфейс для построения системных промптов
 */
export interface SystemPromptBuilder {
  /**
   * Строит полный системный промпт
   * @param isFirstResponse - Является ли это первым ответом в интервью
   * @param currentStage - Текущая стадия интервью
   * @param entity - Данные о gig или vacancy (опционально)
   */
  build(
    isFirstResponse: boolean,
    currentStage: StageId,
    entity?: GigLike | VacancyLike | null,
  ): string;
}
