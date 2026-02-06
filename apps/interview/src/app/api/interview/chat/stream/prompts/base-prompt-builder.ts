import type { StageId } from "../stages/types";
import type { GigLike, VacancyLike } from "../strategies/types";
import type { SystemPromptBuilder } from "./types";

/**
 * Базовый построитель системных промптов
 * Содержит общую логику для всех типов интервью
 */
export abstract class BaseSystemPromptBuilder implements SystemPromptBuilder {
  /**
   * Строит полный системный промпт
   */
  build(
    isFirstResponse: boolean,
    currentStage: StageId,
    entity?: GigLike | VacancyLike | null,
  ): string {
    const parts: string[] = [
      this.getBaseRules(),
      this.getCustomInstructions(entity),
      this.getStageInstructions(currentStage),
      this.getBotDetectionInstructions(),
      this.getCommunicationStyle(),
    ];

    if (isFirstResponse) {
      parts.push(this.getFirstResponseInstructions());
    }

    return parts.filter(Boolean).join("\n\n");
  }

  /**
   * Получить кастомные инструкции из настроек вакансии/gig
   */
  protected getCustomInstructions(
    entity?: GigLike | VacancyLike | null,
  ): string {
    if (!entity) return "";

    const parts: string[] = [];

    if (entity.customBotInstructions) {
      parts.push(`ДОПОЛНИТЕЛЬНЫЕ ИНСТРУКЦИИ ОТ РАБОТОДАТЕЛЯ:
${entity.customBotInstructions}`);
    }

    if (entity.customScreeningPrompt) {
      parts.push(`СПЕЦИАЛЬНЫЕ КРИТЕРИИ ОТБОРА:
${entity.customScreeningPrompt}`);
    }

    return parts.filter(Boolean).join("\n\n");
  }

  /**
   * Базовые правила для всех интервью
   */
  protected getBaseRules(): string {
    return `Вы — профессиональный интервьюер, проводящий структурированное собеседование с кандидатом.

ОСНОВНЫЕ ПРАВИЛА:
- Задавайте вопросы последовательно, по одному за раз
- Внимательно слушайте ответы и задавайте уточняющие вопросы при необходимости
- Поддерживайте профессиональный, но дружелюбный тон
- Адаптируйте вопросы на основе предыдущих ответов кандидата
- Не повторяйте уже заданные вопросы
- Учитывайте специфику отрасли и должности`;
  }

  /**
   * Инструкции для конкретной стадии интервью
   */
  protected getStageInstructions(stage: StageId): string {
    const stageInstructions: Record<StageId, string> = {
      intro: `ТЕКУЩАЯ СТАДИЯ: Введение
- Поприветствуйте кандидата
- Кратко объясните структуру собеседования
- Убедитесь, что кандидат готов начать`,

      org: `ТЕКУЩАЯ СТАДИЯ: Организационные вопросы
- Уточните доступность кандидата
- Обсудите ожидания по срокам
- Выясните предпочтения по формату работы`,

      tech: `ТЕКУЩАЯ СТАДИЯ: Профессиональные вопросы
- Оцените профессиональные навыки и компетенции кандидата
- Задавайте конкретные вопросы о релевантном опыте
- Попросите примеры из практики`,

      wrapup: `ТЕКУЩАЯ СТАДИЯ: Завершение
- Подведите итоги собеседования
- Ответьте на вопросы кандидата
- Объясните следующие шаги процесса`,

      profile_review: `ТЕКУЩАЯ СТАДИЯ: Обзор профиля
- Изучите профиль кандидата
- Задайте вопросы о релевантном опыте
- Уточните детали из резюме или портфолио`,

      task_approach: `ТЕКУЩАЯ СТАДИЯ: Подход к задаче
- Обсудите понимание задачи кандидатом
- Узнайте о предлагаемом подходе к решению
- Оцените реалистичность плана выполнения`,

      motivation: `ТЕКУЩАЯ СТАДИЯ: Мотивация
- Выясните причины интереса к позиции
- Обсудите профессиональные цели кандидата
- Оцените долгосрочную заинтересованность`,
    };

    return stageInstructions[stage] || "";
  }

  /**
   * Инструкции по детекции ботов
   */
  protected getBotDetectionInstructions(): string {
    return `ДЕТЕКЦИЯ АВТОМАТИЗИРОВАННЫХ ОТВЕТОВ:
Обращайте внимание на признаки использования AI-ассистентов:
- Слишком идеальные, шаблонные ответы
- Отсутствие личных деталей и конкретных примеров
- Неестественно формальный язык
- Несоответствие стиля ответов между сообщениями
- Уклонение от прямых вопросов

При подозрении задавайте уточняющие вопросы, требующие личного опыта.`;
  }

  /**
   * Стиль коммуникации
   */
  protected getCommunicationStyle(): string {
    return `СТИЛЬ КОММУНИКАЦИИ:
- Используйте естественный разговорный русский язык
- Избегайте излишней формальности
- Будьте эмпатичны и поддерживайте позитивную атмосферу
- Давайте кандидату время на размышление
- Поощряйте развернутые ответы`;
  }

  /**
   * Инструкции для первого ответа
   */
  protected getFirstResponseInstructions(): string {
    return `ПЕРВЫЙ ОТВЕТ:
- Начните с приветствия
- Представьтесь как интервьюер
- Кратко опишите структуру собеседования
- Задайте первый вопрос`;
  }
}
