/**
 * Intent Classifier для определения намерения пользователя
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "../../core/base-agent";
import { AgentType } from "../../core/types";
import type { ConversationMessage, RecruiterAgentContext } from "../core/types";

export interface IntentClassifierInput {
  message: string;
  conversationHistory: ConversationMessage[];
  currentVacancyId?: string;
}

const intentClassifierOutputSchema = z.object({
  intent: z.enum([
    "SEARCH_CANDIDATES",
    "ANALYZE_VACANCY",
    "GENERATE_CONTENT",
    "COMMUNICATE",
    "CONFIGURE_RULES",
    "GET_PRIORITY",
    "GET_INTERVIEW_QUESTIONS",
    "GENERAL_QUESTION",
  ]),
  confidence: z.number().min(0).max(1),
  extractedEntities: z.object({
    candidateCount: z.number().optional(),
    availability: z.string().optional(),
    skills: z.array(z.string()).optional(),
    vacancyId: z.string().optional(),
    messageType: z.string().optional(),
    candidateId: z.string().optional(),
    responseId: z.string().optional(),
  }),
});

export type IntentClassifierOutput = z.infer<
  typeof intentClassifierOutputSchema
>;

/**
 * Агент для классификации намерений пользователя
 */
export class IntentClassifierAgent extends BaseAgent<
  IntentClassifierInput,
  IntentClassifierOutput
> {
  constructor(config: AgentConfig) {
    const instructions = `Ты — эксперт по классификации намерений рекрутера. Твоя задача — определить, что хочет сделать пользователь.

ТИПЫ НАМЕРЕНИЙ:

1. SEARCH_CANDIDATES — Поиск кандидатов:
   - "Найди кандидатов", "Покажи подходящих", "Кто готов выйти"
   - "Найди 5 кандидатов, готовых выйти за 2 недели"
   - "Покажи кандидатов с опытом Python"
   - Извлекай: количество, доступность, навыки

2. ANALYZE_VACANCY — Анализ вакансии:
   - "Почему мало откликов?", "Проанализируй вакансию"
   - "Что не так с описанием?", "Сравни с рынком"
   - "Какая конверсия?", "Почему не откликаются?"

3. GENERATE_CONTENT — Генерация контента:
   - "Напиши описание вакансии", "Создай заголовок"
   - "Оптимизируй текст", "Сделай A/B варианты"
   - "Улучши требования", "Добавь преимущества"

4. COMMUNICATE — Коммуникация с кандидатами:
   - "Напиши сообщение кандидату", "Пригласи на интервью"
   - "Отправь follow-up", "Напиши отказ"
   - "Уточни у кандидата", "Поприветствуй"

5. CONFIGURE_RULES — Настройка правил автоматизации:
   - "Настрой автоматическое приглашение", "Создай правило"
   - "Измени уровень автономности", "Включи автоответы"
   - "Приостанови вакансию при 100 откликах"

6. GET_PRIORITY — Получение приоритетов кандидатов:
   - "Кого посмотреть первым?", "Покажи приоритетных"
   - "Кто важнее?", "Какие отклики приоритетные?"
   - "С чего начать просмотр?", "Ранжируй кандидатов"
   - Извлекай: vacancyId (если указана конкретная вакансия)

7. GET_INTERVIEW_QUESTIONS — Генерация вопросов для интервью:
   - "Какие вопросы задать?", "Подготовь вопросы для интервью"
   - "Что спросить у кандидата?", "Вопросы для собеседования"
   - "Помоги подготовить интервью", "Какие вопросы уточнить?"
   - Извлекай: candidateId, responseId (если указан конкретный кандидат)

8. GENERAL_QUESTION — Общие вопросы:
   - Вопросы о системе, помощь, статистика
   - Все что не попадает в другие категории

ПРАВИЛА ИЗВЛЕЧЕНИЯ СУЩНОСТЕЙ:
- candidateCount: число кандидатов (если указано)
- availability: срок выхода ("2 недели", "сразу", "месяц")
- skills: массив навыков (["Python", "React"])
- vacancyId: ID вакансии (если упоминается)
- messageType: тип сообщения для COMMUNICATE
- candidateId: ID кандидата (для GET_INTERVIEW_QUESTIONS)
- responseId: ID отклика (для GET_INTERVIEW_QUESTIONS)

ПРИМЕРЫ:
- "Найди 5 кандидатов, готовых выйти за 2 недели" → SEARCH_CANDIDATES, candidateCount: 5, availability: "2 недели"
- "Почему у нас мало откликов?" → ANALYZE_VACANCY
- "Напиши приглашение на интервью" → COMMUNICATE, messageType: "invite"
- "Создай правило для автоприглашения" → CONFIGURE_RULES
- "Кого посмотреть первым?" → GET_PRIORITY
- "Какие вопросы задать кандидату?" → GET_INTERVIEW_QUESTIONS`;

    super(
      "IntentClassifier",
      AgentType.CONTEXT_ANALYZER,
      instructions,
      intentClassifierOutputSchema,
      config,
    );
  }

  protected validate(input: IntentClassifierInput): boolean {
    return !!input.message && input.message.trim().length > 0;
  }

  protected buildPrompt(
    input: IntentClassifierInput,
    _context: RecruiterAgentContext,
  ): string {
    const historyText =
      input.conversationHistory.length > 0
        ? input.conversationHistory
            .slice(-5) // Последние 5 сообщений для контекста
            .map((msg) => {
              const sender = msg.role === "user" ? "Рекрутер" : "Ассистент";
              return `${sender}: ${msg.content}`;
            })
            .join("\n")
        : "";

    const vacancyContext = input.currentVacancyId
      ? `\nТЕКУЩАЯ ВАКАНСИЯ: ${input.currentVacancyId}`
      : "";

    return `${historyText ? `ИСТОРИЯ ДИАЛОГА:\n${historyText}\n` : ""}${vacancyContext}

СООБЩЕНИЕ РЕКРУТЕРА: <message>${input.message}</message>

Определи намерение и извлеки сущности. Верни JSON:
- intent: тип намерения
- confidence: уверенность (0-1)
- extractedEntities: извлеченные данные`;
  }
}
