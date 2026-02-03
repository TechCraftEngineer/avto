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
 * Выходные данные нумерологического анализа
 */
export const numerologyOutputSchema = z.object({
  // Основные нумерологические числа
  lifePathNumber: z.number().int().min(1).max(9), // Число Жизненного Пути
  destinyNumber: z.number().int().min(1).max(9).nullable().optional(), // Число Судьбы
  soulUrgeNumber: z.number().int().min(1).max(9).nullable().optional(), // Число Души

  // Оценка совместимости (0-100)
  compatibilityScore: z.number().int().min(0).max(100),

  // Анализ по аспектам
  roleCompatibility: z.object({
    score: z.number().int().min(0).max(100),
    analysis: z.string(),
  }),

  companyCompatibility: z.object({
    score: z.number().int().min(0).max(100),
    analysis: z.string(),
  }),

  teamCompatibility: z.object({
    score: z.number().int().min(0).max(100),
    analysis: z.string(),
  }),

  // Сильные стороны с точки зрения нумерологии
  strengths: z.array(z.string()),

  // Потенциальные вызовы
  challenges: z.array(z.string()),

  // Рекомендации
  recommendations: z.array(z.string()),

  // Общий нумерологический анализ
  summary: z.string(),

  // Благоприятные периоды для работы
  favorablePeriods: z
    .array(
      z.object({
        period: z.string(),
        description: z.string(),
      }),
    )
    .optional(),
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
      : "Кандидат: Имя не указано\n";

    return `${candidateInfo}Дата рождения: ${formattedDate}

ИНФОРМАЦИЯ О ВАКАНСИИ:
Должность: ${vacancy.title}
${vacancy.summary ? `Описание: ${vacancy.summary}\n` : ""}
${vacancy.companyName ? `Компания: ${vacancy.companyName}\n` : ""}
${vacancy.companyDescription ? `О компании: ${vacancy.companyDescription}\n` : ""}
${vacancy.requiredSkills && vacancy.requiredSkills.length > 0 ? `Требуемые навыки: ${vacancy.requiredSkills.join(", ")}\n` : ""}
${vacancy.workEnvironment ? `Рабочая среда: ${vacancy.workEnvironment}\n` : ""}

ЗАДАЧА:
Проведи глубокий нумерологический анализ совместимости кандидата с данной вакансией.

1. РАССЧИТАЙ ОСНОВНЫЕ ЧИСЛА:
   - Число Жизненного Пути (Life Path Number) - сумма всех цифр даты рождения
   - Число Судьбы (Destiny Number) - если есть имя
   - Число Души (Soul Urge Number) - если есть имя

2. ОЦЕНИ СОВМЕСТИМОСТЬ ПО АСПЕКТАМ (0-100):
   
   a) Совместимость с ролью (roleCompatibility):
   - Соответствуют ли вибрации числа кандидата энергии должности?
   - Будет ли кандидат чувствовать себя реализованным в этой роли?
   - Какие аспекты роли резонируют с его жизненным путем?
   
   b) Совместимость с компанией (companyCompatibility):
   - Соответствуют ли ценности и энергетика компании вибрациям кандидата?
   - Будет ли кандидат гармонично вписываться в корпоративную культуру?
   - Есть ли потенциал для долгосрочного сотрудничества?
   
   c) Совместимость с командой (teamCompatibility):
   - Какую роль кандидат естественно займет в команде согласно его числу?
   - Как его энергия будет взаимодействовать с коллегами?
   - Будет ли он катализатором или стабилизатором?

3. ОПРЕДЕЛИ СИЛЬНЫЕ СТОРОНЫ:
   - Какие уникальные таланты и способности проявляются через числа?
   - Какие качества помогут преуспеть в этой роли?
   - Какой вклад кандидат может внести в команду?

4. ВЫЯВИ ПОТЕНЦИАЛЬНЫЕ ВЫЗОВЫ:
   - Какие аспекты работы могут быть сложными согласно нумерологии?
   - Где могут возникнуть конфликты или напряжение?
   - Что нужно учесть при адаптации?

5. ДАЙ РЕКОМЕНДАЦИИ:
   - Как максимизировать потенциал кандидата?
   - Какие условия работы будут наиболее благоприятны?
   - Как лучше интегрировать кандидата в команду?

6. УКАЖИ БЛАГОПРИЯТНЫЕ ПЕРИОДЫ:
   - Когда лучше начинать работу?
   - Какие периоды будут наиболее продуктивными?

7. РАССЧИТАЙ ОБЩУЮ ОЦЕНКУ СОВМЕСТИМОСТИ (compatibilityScore):
   - Взвешенная оценка всех аспектов (0-100)
   - Учитывай все факторы: роль, компанию, команду

ВАЖНО:
- Будь объективным и профессиональным
- Основывайся на классических принципах нумерологии
- Давай практические, применимые рекомендации
- Избегай излишнего мистицизма, фокусируйся на психологических паттернах
- Все текстовые поля должны быть в формате HTML с тегами: <p>, <strong>, <ul>/<li>, <br>
- Помни: нумерология - это инструмент для понимания личности, а не абсолютная истина`;
  }

  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }
}
