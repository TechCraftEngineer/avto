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
Проведи психологический анализ совместимости кандидата с вакансией на основе даты рождения.

МЕТОДОЛОГИЯ:
1. Используй нумерологические принципы для расчета базовых чисел (Life Path, Destiny, Soul Urge)
2. НО! Переведи эти числа в конкретные психологические характеристики и поведенческие паттерны
3. Избегай упоминания самих чисел в выходных данных - только практические выводы

ФОРМАТ АНАЛИЗА:

1. СОВМЕСТИМОСТЬ С РОЛЬЮ (roleCompatibility, 0-100):
   Вместо: "Число 5 указывает на любовь к переменам"
   Пиши: "Кандидат склонен к многозадачности и быстро адаптируется к новым условиям. В интервью стоит уточнить, как он справляется с рутинными задачами и нужна ли ему постоянная смена активностей."
   
   Фокус:
   - Естественные склонности к типу работы (аналитика, коммуникация, креатив, структура)
   - Мотивационные драйверы (автономия, признание, стабильность, рост)
   - Стиль принятия решений (интуитивный, аналитический, коллективный)
   - Темп работы (быстрый/медленный, спринты/марафоны)

2. СОВМЕСТИМОСТЬ С КОМПАНИЕЙ (companyCompatibility, 0-100):
   Вместо: "Вибрации числа 3 резонируют с креативной средой"
   Пиши: "Кандидат лучше раскрывается в среде, где поощряется самовыражение и обмен идеями. Рекомендуется обсудить корпоративную культуру и возможности для творческого вклада."
   
   Фокус:
   - Предпочтения по организационной структуре (иерархия vs гибкость)
   - Отношение к корпоративным ценностям и миссии
   - Потребность в балансе работа-жизнь
   - Долгосрочные vs краткосрочные цели

3. СОВМЕСТИМОСТЬ С КОМАНДОЙ (teamCompatibility, 0-100):
   Вместо: "Число 1 делает его лидером"
   Пиши: "Кандидат склонен брать инициативу и может естественно направлять других. Важно выяснить, комфортно ли ему работать в роли ведомого и как он реагирует на делегирование задач."
   
   Фокус:
   - Роль в команде (лидер, исполнитель, медиатор, генератор идей)
   - Стиль коммуникации (прямой, дипломатичный, эмоциональный, рациональный)
   - Конфликтное поведение (избегание, компромисс, конфронтация)
   - Потребность в социальном взаимодействии vs автономии

4. СИЛЬНЫЕ СТОРОНЫ (strengths):
   Конкретные качества с примерами применения:
   - "Высокая адаптивность - быстро осваивает новые инструменты и процессы"
   - "Системное мышление - видит связи между разными аспектами проекта"
   - "Эмпатия - легко находит общий язык с разными типами людей"
   
   Для каждой силы добавь: "В интервью спросите о..."

5. ПОТЕНЦИАЛЬНЫЕ ВЫЗОВЫ (challenges):
   Не слабости, а зоны внимания:
   - "Может терять интерес к долгосрочным монотонным проектам - обсудите структуру задач"
   - "Склонен к перфекционизму - уточните дедлайны и критерии 'готово'"
   - "Нуждается в четкой обратной связи - выясните предпочтения по формату фидбека"

6. РЕКОМЕНДАЦИИ ДЛЯ ИНТЕРВЬЮ (recommendations):
   Конкретные вопросы и темы для углубления:
   - "Спросите о предыдущем опыте работы в условиях неопределенности"
   - "Обсудите примеры, когда приходилось балансировать между скоростью и качеством"
   - "Выясните, как кандидат предпочитает получать задачи и отчитываться о результатах"
   - "Уточните отношение к переработкам и срочным задачам"

7. ОБЩИЙ АНАЛИЗ (summary):
   Синтез всех наблюдений в формате:
   - Психологический портрет (2-3 предложения)
   - Ключевые факторы успеха в этой роли
   - На что обратить особое внимание при найме
   - Рекомендации по онбордингу

8. БЛАГОПРИЯТНЫЕ ПЕРИОДЫ (favorablePeriods):
   Вместо: "Период числа 8 - с марта по май"
   Пиши: "Весенний период (март-май) - время высокой продуктивности и открытости к новым начинаниям"

КРИТИЧЕСКИ ВАЖНО:
- НИКОГДА не упоминай числа, вибрации, энергии в выходных данных
- Все выводы должны звучать как психологические наблюдения
- Каждое утверждение должно давать рекрутеру конкретный вопрос для интервью
- Фокус на поведенческих паттернах, а не на эзотерике
- Все текстовые поля в формате HTML: <p>, <strong>, <ul>/<li>, <br>
- Тон: профессиональный HR-консультант, а не нумеролог

ПРИМЕР ХОРОШЕГО ВЫВОДА:
"Кандидат демонстрирует склонность к независимой работе и самостоятельному принятию решений. Это отличное качество для роли, требующей инициативности, но может создать трения в командах с жесткой иерархией. Рекомендуется в интервью обсудить: 1) Опыт работы в структурированных vs гибких командах, 2) Как кандидат реагирует на микроменеджмент, 3) Примеры успешной коллаборации при разных стилях управления."`;
  }

  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }
}
