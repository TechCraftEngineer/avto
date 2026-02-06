import type { StageId } from '../stages/types';

/**
 * Интерфейс для построения системных промптов
 */
export interface SystemPromptBuilder {
  /**
   * Строит полный системный промпт
   * @param isFirstResponse - Является ли это первым ответом в интервью
   * @param currentStage - Текущая стадия интервью
   */
  build(isFirstResponse: boolean, currentStage: StageId): string;
}
