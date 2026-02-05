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
  // Основная оценка (0-100)
  overallScore: z.number().int().min(0).max(100),
  resumeLanguage: z.string(),

  // Общий анализ
  overallAnalysis: z.string(),

  // Детальные оценки по критериям
  skillsMatchScore: z.number().int().min(0).max(100).nullable().optional(),
  experienceScore: z.number().int().min(0).max(100).nullable().optional(),
  potentialScore: z.number().int().min(0).max(100).nullable().optional(),
  careerTrajectoryScore: z.number().int().min(0).max(100).nullable().optional(),
  careerTrajectoryType: z
    .enum(["growth", "stable", "decline", "jump", "role_change"])
    .nullable()
    .optional(),

  // Скрытые индикаторы соответствия
  hiddenFitIndicators: z.array(z.string()).nullable().optional(),

  // Детальные анализы
  skillsAnalysis: z.string().nullable().optional(),
  experienceAnalysis: z.string().nullable().optional(),
  potentialAnalysis: z.string().nullable().optional(),
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

    return `${customInstructions}

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
Имя: ${this.extractFirstName(candidate.candidateName)}

${this.formatProfileData(candidate.profileData)}
${candidate.coverLetter ? `\nСопроводительное письмо:\n${candidate.coverLetter}` : ""}

ЗАДАЧА:
1. Определи язык резюме (ru, en, de, fr, es, it, pt, pl, tr и т.д.) на основе текста опыта работы и сопроводительного письма. Если язык не может быть определен или текст недостаточен, используй 'ru'.

2. Оцени соответствие резюме требованиям по шкале от 0 до 100 (overallScore):
   - 0-20: Абсолютно не подходит (спам, нерелевантный опыт)
   - 21-40: Критическое несоответствие
   - 41-60: Слабое/среднее соответствие
   - 61-80: Хорошее соответствие
   - 81-100: Отличное соответствие

3. ДЕТАЛЬНЫЕ ОЦЕНКИ (каждая от 0 до 100):
   - skillsMatchScore: Соответствие навыков требованиям
   - experienceScore: Релевантность и глубина опыта
   - potentialScore: Способность реально справиться с задачей и потенциал роста
   
   КРИТИЧЕСКИ ВАЖНО для potentialScore: Оценивай не только соответствие требованиям, но и способность кандидата РЕАЛЬНО СПРАВИТЬСЯ С ЗАДАЧЕЙ.
   
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
   - overallAnalysis: Общий анализ соответствия (2-3 предложения)
   - skillsAnalysis: Анализ навыков (1-2 предложения)
   - experienceAnalysis: Анализ опыта (1-2 предложения)
   - potentialAnalysis: Анализ потенциала кандидата (2-3 предложения)
   - careerTrajectoryAnalysis: Анализ карьерной траектории (2-3 предложения)
   - hiddenFitAnalysis: Анализ скрытых индикаторов соответствия, если они есть (1-2 предложения)

ВАЖНО:
- Фокусируйся на потенциале кандидата, а не только на формальном соответствии требованиям
- Выявляй "скрытых подходящих" — кандидатов с неидеальным резюме, но сильным потенциалом
- Анализируй карьерную логику: рост, деградация, скачки, смена ролей
- Помни: "Мы отбираем тех, кто реально справится с задачей, а не тех, кто красиво написал резюме"
- Все текстовые поля должны быть в формате HTML с тегами: <p>, <strong>, <ul>/<li>, <br>`;
  }

  private extractFirstName(fullName: string | null): string {
    if (!fullName) return "Не указано";
    const parts = fullName.trim().split(/\s+/);
    return parts[0] || "Не указано";
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
