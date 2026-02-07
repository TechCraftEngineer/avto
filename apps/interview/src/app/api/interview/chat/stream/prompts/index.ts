import type { StageId } from "../stages/types";
import type { SupportedEntityType } from "../strategies/types";
import { GigSystemPromptBuilder } from "./gig-prompt-builder";
import type { SystemPromptBuilder } from "./types";
import { VacancySystemPromptBuilder } from "./vacancy-prompt-builder";

/**
 * Фабрика для создания построителей промптов
 */
export class PromptFactory {
  private builders: Map<SupportedEntityType, SystemPromptBuilder>;

  constructor() {
    this.builders = new Map<SupportedEntityType, SystemPromptBuilder>([
      ["gig", new GigSystemPromptBuilder()],
      ["vacancy", new VacancySystemPromptBuilder()],
    ] as const);
  }

  /**
   * Создает построитель промптов для указанного типа сущности
   */
  create(entityType: SupportedEntityType): SystemPromptBuilder {
    const builder = this.builders.get(entityType);
    if (!builder) {
      // Fallback на vacancy построитель для неизвестных типов
      const fallback = this.builders.get("vacancy");
      if (!fallback) {
        throw new Error("Vacancy builder not found");
      }
      return fallback;
    }
    return builder;
  }

  /**
   * Строит полный промпт для указанного типа сущности
   */
  buildCompletePrompt(
    entityType: SupportedEntityType,
    isFirstResponse: boolean,
    currentStage: StageId,
  ): string {
    const builder = this.create(entityType);
    return builder.build(isFirstResponse, currentStage);
  }

  /**
   * Проверяет, поддерживается ли тип сущности
   */
  isSupported(entityType: string): entityType is SupportedEntityType {
    return this.builders.has(entityType as SupportedEntityType);
  }
}

// Singleton экземпляр фабрики
export const promptFactory = new PromptFactory();

export { BaseSystemPromptBuilder } from "./base-prompt-builder";
export { GigSystemPromptBuilder } from "./gig-prompt-builder";
// Экспорт типов и классов
export type { SystemPromptBuilder } from "./types";
export { VacancySystemPromptBuilder } from "./vacancy-prompt-builder";
