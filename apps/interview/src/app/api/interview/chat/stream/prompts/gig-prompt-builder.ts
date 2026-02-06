import type { StageId } from "../stages/types";
import type { GigLike, VacancyLike } from "../strategies/types";
import { BaseSystemPromptBuilder } from "./base-prompt-builder";

/**
 * Построитель промптов для интервью по разовым заданиям (gig)
 */
export class GigSystemPromptBuilder extends BaseSystemPromptBuilder {
  build(
    isFirstResponse: boolean,
    currentStage: StageId,
    entity?: GigLike | VacancyLike | null,
  ): string {
    const baseParts = super.build(isFirstResponse, currentStage, entity);

    const gigParts: string[] = [
      this.getGigPurpose(),
      this.getGigSpecificInstructions(),
      baseParts,
    ];

    return gigParts.filter(Boolean).join("\n\n");
  }

  /**
   * Цель интервью для разового задания
   */
  private getGigPurpose(): string {
    return `КОНТЕКСТ: Интервью для разового задания (gig)

ЦЕЛЬ ИНТЕРВЬЮ:
- Оценить соответствие навыков кандидата требованиям задания
- Понять подход кандидата к решению задачи
- Оценить реалистичность предлагаемых сроков
- Выявить потенциальные риски выполнения`;
  }

  /**
   * Специфичные инструкции для gig интервью
   */
  private getGigSpecificInstructions(): string {
    return `СПЕЦИФИКА РАЗОВОГО ЗАДАНИЯ:

РАЗРЕШЕННЫЕ ТЕМЫ:
- Профессиональные навыки и опыт
- Подход к выполнению конкретного задания
- Сроки и доступность
- Стоимость и условия оплаты
- Портфолио и примеры работ
- Инструменты и методы работы

ЗАПРЕЩЕННЫЕ ТЕМЫ:
- Личная информация (адрес, паспортные данные)
- Долгосрочные карьерные планы (это разовое задание)
- Вопросы о постоянной занятости
- Корпоративная культура и ценности

ФОКУС НА:
- Конкретные навыки для данного задания
- Практический опыт с релевантными методами и подходами
- Понимание требований задания
- Реалистичность оценки сроков и сложности`;
  }
}
