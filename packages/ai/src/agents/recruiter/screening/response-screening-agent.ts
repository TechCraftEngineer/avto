/**
 * ResponseScreeningAgent - AI агент для скрининга откликов кандидатов
 */

import { z } from "zod";
import type { VacancyRequirements } from "../../../screening-prompts";
import { type AgentConfig, BaseAgent } from "../../core/base-agent";
import { AgentType } from "../../core/types";
import { RESPONSE_SCREENING_SYSTEM_PROMPT } from "./prompts";

/**
 * Входные данные для скрининга отклика
 */
export const responseScreeningInputSchema = z.object({
  // Данные кандидата
  candidate: z.object({
    candidateName: z.string().nullable(),
    coverLetter: z.string().nullable().optional(),
    profileData: z.unknown().nullable().optional(),
  }),

  // Требования вакансии (используем существующий тип)
  requirements: z.custom<VacancyRequirements>(),

  // Кастомный промпт от рекрутера
  customPrompt: z.string().nullable().optional(),
});

export type ResponseScreeningInput = z.infer<
  typeof responseScreeningInputSchema
>;

/**
 * Выходные данные скрининга отклика
 */
export const responseScreeningOutputSchema = z.object({
  // Основные оценки
  score: z.number().int().min(0).max(5), // Оценка от 1 до 5
  detailedScore: z.number().int().min(0).max(100), // Детальная оценка 0-100
  resumeLanguage: z.string(),
  analysis: z.string(), // Общий анализ

  // Устаревшие поля (для обратной совместимости)
  overallScore: z.number().int().min(0).max(100).optional(),
  overallAnalysis: z.string().optional(),

  // Детальные оценки по критериям
  skillsMatchScore: z.number().int().min(0).max(100),
  experienceScore: z.number().int().min(0).max(100),
  potentialScore: z.number().int().min(0).max(100),
  careerTrajectoryScore: z.number().int().min(0).max(100).nullable().optional(),
  careerTrajectoryType: z
    .enum(["growth", "stable", "decline", "jump", "role_change"])
    .nullable()
    .optional(),

  // Скрытые индикаторы соответствия
  hiddenFitIndicators: z.array(z.string()).nullable().optional(),

  // Детальные анализы
  skillsAnalysis: z.string(),
  experienceAnalysis: z.string(),
  potentialAnalysis: z.string(),
  careerTrajectoryAnalysis: z.string().nullable().optional(),
  hiddenFitAnalysis: z.string().nullable().optional(),

  // Сильные и слабые стороны
  strengths: z.array(z.string()).nullable().optional(),
  weaknesses: z.array(z.string()).nullable().optional(),

  // Рекомендация
  recommendation: z
    .enum(["HIGHLY_RECOMMENDED", "RECOMMENDED", "NEUTRAL", "NOT_RECOMMENDED"])
    .nullable()
    .optional(),
});

export type ResponseScreeningOutput = z.infer<
  typeof responseScreeningOutputSchema
>;

/**
 * Агент для скрининга откликов кандидатов
 */
export class ResponseScreeningAgent extends BaseAgent<
  ResponseScreeningInput,
  ResponseScreeningOutput
> {
  constructor(config: AgentConfig) {
    super(
      "ResponseScreening",
      AgentType.EVALUATOR,
      RESPONSE_SCREENING_SYSTEM_PROMPT,
      responseScreeningOutputSchema,
      config,
    );
  }

  protected validate(input: ResponseScreeningInput): boolean {
    // Проверяем наличие минимально необходимых данных
    return (
      !!input.candidate &&
      !!input.requirements &&
      !!input.requirements.job_title
    );
  }

  protected buildPrompt(
    input: ResponseScreeningInput,
    _context: unknown,
  ): string {
    const { candidate, requirements, customPrompt } = input;

    const customInstructions = customPrompt
      ? `\n\nДОПОЛНИТЕЛЬНЫЕ ИНСТРУКЦИИ ОТ РЕКРУТЕРА:\n${customPrompt}\n`
      : "";

    const prompt = `${customInstructions}

ТРЕБОВАНИЯ ВАКАНСИИ:
Позиция: ${requirements.job_title}
Описание: ${requirements.summary}

Обязательные требования:
${requirements.mandatory_requirements.map((r) => `- ${r}`).join("\n")}

Желательные навыки:
${requirements.nice_to_have_skills.map((s) => `- ${s}`).join("\n")}

Технологический стек: ${requirements.tech_stack.join(", ")}

Опыт: ${requirements.experience_years.description}

Языки: ${requirements.languages.map((l) => `${l.language} (${l.level})`).join(", ")}

РЕЗЮМЕ КАНДИДАТА:

${this.formatProfileData(candidate.profileData)}
${candidate.coverLetter ? `\nСопроводительное письмо:\n${candidate.coverLetter}` : ""}

ЗАДАЧА:
1. Определи язык резюме (ru, en, de, fr, es, it, pt, pl, tr и т.д.) на основе текста опыта работы и сопроводительного письма. Если язык не может быть определен или текст недостаточен, используй 'ru'.

2. ОСНОВНЫЕ ОЦЕНКИ:
   
   a) detailedScore (0-100) - Детальная оценка соответствия резюме требованиям:
      - 0-20: Абсолютно не подходит (спам, нерелевантный опыт)
      - 21-40: Критическое несоответствие
      - 41-60: Слабое/среднее соответствие
      - 61-80: Хорошее соответствие
      - 81-100: Отличное соответствие
   
   b) score (0-5) - Упрощенная оценка для быстрого просмотра:
      - 0: Не подходит (detailedScore 0-20)
      - 1: Очень слабое соответствие (detailedScore 21-40)
      - 2: Слабое соответствие (detailedScore 41-50)
      - 3: Среднее соответствие (detailedScore 51-70)
      - 4: Хорошее соответствие (detailedScore 71-85)
      - 5: Отличное соответствие (detailedScore 86-100)
   
   ВАЖНО: score должен соответствовать detailedScore по указанным диапазонам.

3. ДЕТАЛЬНЫЕ ОЦЕНКИ (ОБЯЗАТЕЛЬНЫЕ ПОЛЯ, каждая от 0 до 100):
   
   ВАЖНО: Эти три поля ОБЯЗАТЕЛЬНЫ и должны быть заполнены числами от 0 до 100:
   
   - skillsMatchScore (ОБЯЗАТЕЛЬНО): Соответствие навыков требованиям
     * Оцени насколько навыки кандидата соответствуют обязательным требованиям
     * Учитывай наличие желательных навыков
     * Оцени соответствие технологическому стеку
   
   - experienceScore (ОБЯЗАТЕЛЬНО): Релевантность и глубина опыта
     * Оцени релевантность опыта работы для данной позиции
     * Учитывай глубину и качество опыта
     * Оцени соответствие уровня опыта требованиям
   
   - potentialScore (ОБЯЗАТЕЛЬНО): Способность реально справиться с задачей и потенциал роста
     * КРИТИЧЕСКИ ВАЖНО: Оценивай не только соответствие требованиям, но и способность кандидата РЕАЛЬНО СПРАВИТЬСЯ С ЗАДАЧЕЙ
   
   Учитывай:
   - Способность реально выполнить задачи роли (не только формальное соответствие)
   - Обучаемость и адаптивность (способность быстро освоить новые навыки)
   - Потенциал для роста в роли
   - Передаваемые навыки из смежных областей
   - Логику карьерного пути (рост, стабильность, деградация, скачки)

4. ВЫЯВЛЕНИЕ СКРЫТЫХ ПОДХОДЯЩИХ (hiddenFitIndicators):
   Ищи неочевидные сигналы о том, что кандидат может быть сильнее, чем кажется по резюме:
   - Переходы между смежными ролями (Backend → Fullstack, Developer → Tech Lead)
   - Рост сложности проектов в карьере
   - Нестандартный опыт, который релевантен для роли
   - Признаки высокой мотивации (смена карьеры, самообучение, проекты вне работы)
   - Передаваемые навыки из других областей
   
   Если находишь такие индикаторы, добавь их в массив hiddenFitIndicators.

5. АНАЛИЗ КАРЬЕРНОЙ ЛОГИКИ:
   Проанализируй карьерную траекторию кандидата:
   - Тип траектории: рост (growth), стабильность (stable), деградация (decline), скачок (jump), смена роли (role_change)
   - Логичность переходов между ролями
   - Скорость и стабильность роста
   - Признаки деградации или стагнации
   - Потенциал для дальнейшего роста
   
   Оцени карьерную траекторию (careerTrajectoryScore) от 0 до 100:
   - Высокая оценка: логичный рост, стабильность, качественные переходы
   - Средняя оценка: стабильность без роста или нестабильность с потенциалом
   - Низкая оценка: деградация, нелогичные скачки, стагнация

6. СИЛЬНЫЕ И СЛАБЫЕ СТОРОНЫ:
   - strengths: Массив из 3-5 ключевых сильных сторон кандидата
   - weaknesses: Массив из 2-4 слабых сторон или областей для развития

7. РЕКОМЕНДАЦИЯ (recommendation):
   - HIGHLY_RECOMMENDED: Отличное соответствие, приглашать на интервью немедленно
   - RECOMMENDED: Хорошее соответствие, стоит рассмотреть
   - NEUTRAL: Среднее соответствие, можно рассмотреть при нехватке кандидатов
   - NOT_RECOMMENDED: Не рекомендуется к рассмотрению

8. Напиши анализы (все в формате HTML с тегами <p>, <strong>, <ul>/<li>, <br>):
   - analysis (ОБЯЗАТЕЛЬНО): Общий анализ соответствия (2-3 предложения) - БЕЗ заголовков, только текст
   - skillsAnalysis (ОБЯЗАТЕЛЬНО): Анализ навыков (1-2 предложения) - БЕЗ заголовков, только текст
   - experienceAnalysis (ОБЯЗАТЕЛЬНО): Анализ опыта (1-2 предложения) - БЕЗ заголовков, только текст
   - potentialAnalysis (ОБЯЗАТЕЛЬНО): Анализ потенциала кандидата (2-3 предложения) - БЕЗ заголовков, только текст
   - careerTrajectoryAnalysis (опционально): Анализ карьерной траектории (2-3 предложения) - БЕЗ заголовков, только текст
   - hiddenFitAnalysis (опционально): Анализ скрытых индикаторов соответствия, если они есть (1-2 предложения) - БЕЗ заголовков, только текст

ВАЖНО:
- Фокусируйся на потенциале кандидата, а не только на формальном соответствии требованиям
- Выявляй "скрытых подходящих" — кандидатов с неидеальным резюме, но сильным потенциалом
- Анализируй карьерную логику: рост, деградация, скачки, смена ролей
- Помни: "Мы отбираем тех, кто реально справится с задачей, а не тех, кто красиво написал резюме"
- Все текстовые поля должны быть в формате HTML с тегами: <p>, <strong>, <ul>/<li>, <br>
- НЕ ИСПОЛЬЗУЙ английские заголовки полей (careerTrajectoryAnalysis, skillsAnalysis и т.д.) в тексте анализа - пиши только содержание

КРИТИЧЕСКИ ВАЖНО - ЯЗЫК АНАЛИЗА:
- Пиши анализы ТОЛЬКО на чистом русском языке
- ИСПОЛЬЗУЙ русские термины: "навыки", "младший разработчик", "средний разработчик", "старший разработчик", "руководитель команды", "полный цикл разработки", "серверная разработка", "клиентская разработка", "набор технологий", "личные качества", "технические навыки"
- ИСКЛЮЧЕНИЯ (можно использовать как есть): названия технологий (React, TypeScript, Python), должности на английском (если указаны в резюме), устоявшиеся термины без адекватного перевода
- Примеры правильных формулировок:
  ✅ "Кандидат обладает сильными навыками в области серверной разработки"
  ✅ "Опыт работы с современными технологиями веб-разработки"
  ✅ "Переход от младшего к среднему разработчику занял 2 года"
  ❌ "Кандидат имеет сильные бэкенд скиллы"
  ❌ "Опыт работы с современным веб-стеком"
  ❌ "Переход от джуна к мидлу занял 2 года"`;

    console.log(
      `[ResponseScreening] Building prompt with ${requirements.mandatory_requirements.length} mandatory requirements`,
    );
    console.log(
      `[ResponseScreening] Prompt includes section 3 with ОБЯЗАТЕЛЬНЫЕ ПОЛЯ: ${prompt.includes("ОБЯЗАТЕЛЬНЫЕ ПОЛЯ")}`,
    );

    return prompt;
  }

  private formatProfileData(profileData: unknown): string {
    if (!profileData || typeof profileData !== "object") {
      return "Опыт работы:\nНе указан";
    }

    const data = profileData as Record<string, unknown>;
    const sections: string[] = [];

    // Краткая информация
    const summary = this.formatSummary(data);
    if (summary) {
      sections.push(`Краткая информация:\n${summary}`);
    }

    // Опыт работы
    const experience = this.formatExperience(data);
    if (experience) {
      sections.push(`Опыт работы:\n${experience}`);
    } else {
      sections.push("Опыт работы:\nНе указан");
    }

    // Образование
    const education = this.formatEducation(data);
    if (education) {
      sections.push(`Образование:\n${education}`);
    }

    // Языки
    const languages = this.formatLanguages(data);
    if (languages) {
      sections.push(`Языки кандидата:\n${languages}`);
    }

    return sections.join("\n\n");
  }

  private formatSummary(data: Record<string, unknown>): string | null {
    if (data.summary && typeof data.summary === "string") {
      return data.summary;
    }
    if (data.aboutMe && typeof data.aboutMe === "string") {
      return data.aboutMe;
    }
    return null;
  }

  private formatEducation(data: Record<string, unknown>): string | null {
    if (!Array.isArray(data.education)) return null;

    return data.education
      .map((edu: unknown) => {
        if (typeof edu === "object" && edu !== null) {
          const e = edu as Record<string, unknown>;
          const parts: string[] = [];

          if (e.degree) parts.push(String(e.degree));
          if (e.field) parts.push(String(e.field));
          if (e.institution) parts.push(`— ${e.institution}`);

          const period: string[] = [];
          if (e.startDate) period.push(String(e.startDate));
          if (e.endDate) period.push(String(e.endDate));
          if (period.length > 0) parts.push(`(${period.join(" - ")})`);

          return parts.join(" ");
        }
        return String(edu);
      })
      .join("\n");
  }

  private formatLanguages(data: Record<string, unknown>): string | null {
    if (!Array.isArray(data.languages)) return null;

    return data.languages
      .map((lang: unknown) => {
        if (typeof lang === "object" && lang !== null) {
          const l = lang as Record<string, unknown>;
          if (l.name && l.level) {
            return `${l.name}: ${l.level}`;
          }
          if (l.name) return String(l.name);
        }
        return String(lang);
      })
      .join(", ");
  }

  private formatExperience(data: Record<string, unknown>): string | null {
    // Проверяем наличие experience в profileData
    if (Array.isArray(data.experience)) {
      return data.experience
        .map((exp: unknown) => {
          if (typeof exp === "object" && exp !== null) {
            const expObj = exp as Record<string, unknown>;

            // Поддержка вложенной структуры {experience: {...}}
            const e =
              expObj.experience && typeof expObj.experience === "object"
                ? (expObj.experience as Record<string, unknown>)
                : expObj;

            const parts: string[] = [];

            if (e.position) parts.push(String(e.position));
            if (e.company) parts.push(`в ${e.company}`);
            if (e.period) parts.push(`(${e.period})`);
            if (e.description) parts.push(`\n${e.description}`);

            return parts.join(" ");
          }
          return String(exp);
        })
        .join("\n\n");
    }

    // Если есть summary, используем его
    if (data.summary && typeof data.summary === "string") {
      return data.summary;
    }

    // Для фрилансеров: aboutMe
    if (data.aboutMe && typeof data.aboutMe === "string") {
      return data.aboutMe;
    }

    return null;
  }
}
