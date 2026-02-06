import type { SupportedEntityType } from '../strategies/types';
import type { StageId } from '../stages/types';
import type { SystemPromptBuilder } from './types';
import { GigSystemPromptBuilder } from './gig-prompt-builder';
import { VacancySystemPromptBuilder } from './vacancy-prompt-builder';

/**
 * Фабрика для создания построителей промптов
 */
export class PromptFactory {
  private builders: Map<SupportedEntityType, SystemPromptBuilder>;

  constructor() {
    this.builders = new Map([
      ['gig', new GigSystemPromptBuilder()],
      ['vacancy', new VacancySystemPromptBuilder()],
    ]);
  }

  /**
   * Создает построитель промптов для указанного типа сущности
   */
  create(entityType: SupportedEntityType): SystemPromptBuilder {
    const builder = this.builders.get(entityType);
    if (!builder) {
      // Fallback на vacancy построитель для неизвестных типов
      return this.builders.get('vacancy')!;
    }
    return builder;
  }

  /**
   * Строит полный промпт для указанного типа сущности
   */
  buildCompletePrompt(
    entityType: SupportedEntityType,
    isFirstResponse: boolean,
    currentStage: StageId
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

// Экспорт типов и классов
export type { SystemPromptBuilder } from './types';
export { BaseSystemPromptBuilder } from './base-prompt-builder';
export { GigSystemPromptBuilder } from './gig-prompt-builder';
export { VacancySystemPromptBuilder } from './vacancy-prompt-builder';
