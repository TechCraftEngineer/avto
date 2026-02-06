import { GigInterviewStrategy } from "./gig-strategy";
import type {
  GigLike,
  InterviewStrategy,
  SupportedEntityType,
  VacancyLike,
} from "./types";
import { VacancyInterviewStrategy } from "./vacancy-strategy";

/**
 * Фабрика для создания стратегий интервью на основе типа сущности
 */
export class InterviewStrategyFactory {
  private strategies: Map<SupportedEntityType, () => InterviewStrategy> =
    new Map<SupportedEntityType, () => InterviewStrategy>([
      ["gig", () => new GigInterviewStrategy()],
      ["vacancy", () => new VacancyInterviewStrategy()],
      // Будущие типы сущностей могут быть добавлены здесь
      // ["project", () => new ProjectInterviewStrategy()],
    ]);

  /**
   * Создать стратегию для указанного типа сущности
   * @param entityType - Тип сущности (gig, vacancy, project)
   * @returns Экземпляр стратегии интервью
   */
  create(entityType: SupportedEntityType): InterviewStrategy {
    const factory = this.strategies.get(entityType);
    if (!factory) {
      console.warn(
        `[StrategyFactory] Неизвестный тип сущности: ${entityType}, используется vacancy`,
      );
      return new VacancyInterviewStrategy();
    }
    return factory();
  }

  /**
   * Зарегистрировать новую стратегию для типа сущности
   * @param entityType - Тип сущности
   * @param strategyFactory - Фабричная функция для создания стратегии
   */
  register(
    entityType: SupportedEntityType,
    strategyFactory: () => InterviewStrategy,
  ): void {
    this.strategies.set(entityType, strategyFactory);
  }

  /**
   * Проверить поддерживается ли тип сущности
   * @param entityType - Тип сущности для проверки
   * @returns true если тип поддерживается
   */
  isSupported(entityType: string): entityType is SupportedEntityType {
    return this.strategies.has(entityType as SupportedEntityType);
  }
}

/**
 * Singleton экземпляр фабрики стратегий
 */
export const strategyFactory = new InterviewStrategyFactory();

/**
 * Helper функция для получения стратегии на основе наличия gig или vacancy
 * @param gig - Объект разового задания или null
 * @param vacancy - Объект вакансии или null
 * @returns Стратегия интервью для соответствующего типа сущности
 */
export function getInterviewStrategy(
  gig: GigLike | null,
  vacancy: VacancyLike | null,
): InterviewStrategy {
  if (!gig && !vacancy) {
    console.warn(
      "[Strategy] Не предоставлена сущность, используется vacancy стратегия",
    );
    return strategyFactory.create("vacancy");
  }

  const entityType: SupportedEntityType = gig ? "gig" : "vacancy";
  return strategyFactory.create(entityType);
}

export { BaseInterviewStrategy } from "./base-strategy";
export { GigInterviewStrategy } from "./gig-strategy";
// Экспорт типов и классов
export type { InterviewStrategy, SupportedEntityType } from "./types";
export { VacancyInterviewStrategy } from "./vacancy-strategy";
