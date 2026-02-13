/**
 * NumerologyAgent - AI агент для нумерологического анализа кандидата
 * Использует классические принципы нумерологии для оценки совместимости с вакансией
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "../../core/base-agent";
import { AgentType } from "../../core/types";
import { NUMEROLOGY_SYSTEM_PROMPT } from "./prompts";

/**
 * Входные данные для нумерологического анализа
 */
export const numerologyInputSchema = z.object({
  // Дата рождения кандидата
  birthDate: z.date(),

  // Имя кандидата (опционально, для персонализации)
  candidateName: z.string().nullable().optional(),

  // Информация о вакансии
  vacancy: z.object({
    title: z.string(),
    summary: z.string().optional(),
    companyName: z.string().optional(),
    companyDescription: z.string().optional(),
    requiredSkills: z.array(z.string()).optional(),
    workEnvironment: z.string().optional(), // Описание рабочей среды
  }),
});

export type NumerologyInput = z.infer<typeof numerologyInputSchema>;

/**
 * Выходные данные нумерологического анализа (оптимизировано для скрининга)
 */
export const numerologyOutputSchema = z.object({
  // Оценка совместимости (0-100) — основной показатель для отсева
  compatibilityScore: z.number().int().min(0).max(100),

  // Краткий психологический портрет
  summary: z.string().max(3000),

  // Сильные стороны — 2-3 пункта
  strengths: z.array(z.string()).min(2).max(3),

  // Зоны внимания / красные флаги — 2-3 пункта
  challenges: z.array(z.string()).min(2).max(3),

  // Вопросы для интервью — 3-4 пункта
  recommendations: z.array(z.string()).min(3).max(4),
});

export type NumerologyOutput = z.infer<typeof numerologyOutputSchema>;

/**
 * Агент для нумерологического анализа кандидата
 */
export class NumerologyAgent extends BaseAgent<
  NumerologyInput,
  NumerologyOutput
> {
  constructor(config: AgentConfig) {
    super(
      "Numerology",
      AgentType.EVALUATOR,
      NUMEROLOGY_SYSTEM_PROMPT,
      numerologyOutputSchema,
      config,
      numerologyInputSchema,
    );
  }

  protected validate(input: NumerologyInput): boolean {
    // Проверяем наличие минимально необходимых данных
    return !!input.birthDate && !!input.vacancy && !!input.vacancy.title;
  }

  protected buildPrompt(input: NumerologyInput, _context: unknown): string {
    const { birthDate, candidateName, vacancy } = input;

    const formattedDate = this.formatDate(birthDate);
    const candidateInfo = candidateName
      ? `Кандидат: ${candidateName}\n`
      : "";

    return `${candidateInfo}Дата рождения: ${formattedDate}

ВАКАНСИЯ: ${vacancy.title}
${vacancy.summary ? `Описание: ${vacancy.summary}\n` : ""}

ЗАДАЧА: Оцени совместимость кандидата с вакансией для быстрого скрининга. Используй нумерологию как основу, но формулируй выводы как психологические наблюдения — без упоминания чисел и эзотерики.

ВЫВОД (кратко, 2-4 предложения):
- compatibilityScore (0-100): общая оценка совместимости
- summary: психологический портрет, ключевые факторы успеха в роли, на что обратить внимание
- strengths (2-3): конкретные качества с практическим применением
- challenges (2-3): зоны внимания, не слабости — что обсудить в интервью
- recommendations (3-4): конкретные вопросы для интервью

ФОРМАТ: HTML для текстов (<p>, <strong>, <ul>/<li>). Тон — профессиональный HR.`;
  }

  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }
}
