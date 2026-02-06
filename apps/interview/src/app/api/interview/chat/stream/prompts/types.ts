import type { StageId } from "../stages/types";
import type { GigLike, VacancyLike } from "../strategies/types";

/**
 * Настройки бота для промпта
 */
export interface BotSettings {
  botName?: string;
  botRole?: string;
  companyName?: string;
}

/**
 * Интерфейс для построения системных промптов
 */
export interface SystemPromptBuilder {
  /**
   * Строит полный системный промпт
   * @param isFirstResponse - Является ли это первым ответом в интервью
   * @param currentStage - Текущая стадия интервью
   * @param entity - Данные о gig или vacancy (опционально)
   * @param botSettings - Настройки бота (имя, роль, компания)
   * @param askedQuestions - Список уже заданных вопросов для избежания повторов
   */
  build(
    isFirstResponse: boolean,
    currentStage: StageId,
    entity?: GigLike | VacancyLike | null,
    botSettings?: BotSettings,
    askedQuestions?: string[],
  ): string;
}
