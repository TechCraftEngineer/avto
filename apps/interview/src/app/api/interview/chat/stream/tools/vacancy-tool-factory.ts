import { BaseToolFactory } from './base-tool-factory';

/**
 * Фабрика инструментов для интервью по вакансиям
 * Использует только базовые инструменты без дополнительных
 */
export class VacancyToolFactory extends BaseToolFactory {
  constructor() {
    super('vacancy');
  }

  // Использует базовую реализацию без изменений
  // Не добавляет специфичных инструментов для vacancy
}
