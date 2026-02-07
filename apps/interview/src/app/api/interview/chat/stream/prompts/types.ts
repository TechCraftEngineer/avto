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
 * Инсайты из предварительного скрининга
 */
export interface ScreeningInsights {
  overallScore: number;
  recommendation: string | null;
  strengths: string[];
  weaknesses: string[];
  skillsMatchScore: number | null;
  experienceScore: number | null;
  candidateSummary: string | null;
  rankingAnalysis: string | null;
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
   * @param screening - Результаты предварительного скрининга (опционально)
   */
  build(
    isFirstResponse: boolean,
    currentStage: StageId,
    entity?: GigLike | VacancyLike | null,
    botSettings?: BotSettings,
    askedQuestions?: string[],
    screening?: ScreeningInsights | null,
  ): string;
}
