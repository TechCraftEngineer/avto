import type { z } from "zod";
import type { SupportedEntityType } from "../strategies/types";
import { gigScoringSchema, vacancyScoringSchema } from "./schemas";

/**
 * Фабрика для создания схем оценки на основе типа сущности
 */
export class ScoringFactory {
  private schemas: Map<SupportedEntityType, z.ZodSchema>;

  constructor() {
    this.schemas = new Map([
      ["gig", gigScoringSchema],
      ["vacancy", vacancyScoringSchema],
    ]);
  }

  /**
   * Создает схему оценки для указанного типа сущности
   */
  createSchema(entityType: SupportedEntityType): z.ZodSchema {
    const schema = this.schemas.get(entityType);
    if (!schema) {
      // Fallback на vacancy схему для неизвестных типов
      return vacancyScoringSchema;
    }
    return schema;
  }

  /**
   * Проверяет, поддерживается ли тип сущности
   */
  isSupported(entityType: string): entityType is SupportedEntityType {
    return this.schemas.has(entityType as SupportedEntityType);
  }
}

// Singleton экземпляр фабрики
export const scoringFactory = new ScoringFactory();

export type { GigScoring, VacancyScoring } from "./schemas";
// Экспорт схем для прямого использования
export { gigScoringSchema, vacancyScoringSchema } from "./schemas";
