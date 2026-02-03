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
  score: z.number().int().min(0).max(5),
  detailedScore: z.number().int().min(0).max(100),
  resumeLanguage: z.string(),

  // Анализ
  analysis: z.string(),

  // Дополнительные оценки
  potentialScore: z.number().int().min(0).max(100).nullable().optional(),
  careerTrajectoryScore: z.number().int().min(0).max(100).nullable().optional(),
  careerTrajectoryType: z
    .enum(["growth", "stable", "decline", "jump", "role_change"])
    .nullable()
    .optional(),

  // Скрытые индикаторы соответствия
  hiddenFitIndicators: z.array(z.string()).nullable().optional(),

  // Дополнительные анализы
  potentialAnalysis: z.string().nullable().optional(),
  careerTrajectoryAnalysis: z.string().nullable().optional(),
  hiddenFitAnalysis: z.string().nullable().optional(),
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

Опыт работы:
${this.formatExperience(candidate) || "Не указан"}
${candidate.coverLetter ? `\nСопроводительное письмо:\n${candidate.coverLetter}` : ""}

ЗАДАЧА:
1. Определи язык резюме (ru, en, de, fr, es, it, pt, pl, tr и т.д.) на основе текста опыта работы и сопроводительного письма. Если язык не может быть определен или текст недостаточен, используй 'ru'.

2. Оцени соответствие резюме требованиям по двум шкалам:
   
   a) Общая оценка (score) от 0 до 5:
   - 0: Абсолютно не подходит (спам, нерелевантный опыт)
   - 1: Критическое несоответствие
   - 2: Слабое соответствие
   - 3: Среднее соответствие
   - 4: Хорошее соответствие
   - 5: Отличное соответствие
   
   b) Детальная оценка (detailedScore) от 0 до 100:
   - Более точная оценка для определения победителя среди кандидатов
   - Учитывай все нюансы: опыт, навыки, образование, языки, мотивацию
   - Эта оценка поможет ранжировать кандидатов с одинаковым score

3. ОЦЕНКА ПОТЕНЦИАЛА (potentialScore) от 0 до 100:
   КРИТИЧЕСКИ ВАЖНО: Оценивай не только соответствие требованиям, но и способность кандидата РЕАЛЬНО СПРАВИТЬСЯ С ЗАДАЧЕЙ.
   
   Учитывай:
   - Способность реально выполнить задачи роли (не только формальное соответствие)
   - Обучаемость и адаптивность (способность быстро освоить новые навыки)
   - Потенциал для роста в роли
   - Передаваемые навыки из смежных областей
   - Логику карьерного пути (рост, стабильность, деградация, скачки)
   
   Примеры высокого потенциала:
   - Кандидат с неидеальным резюме, но сильным потенциалом (переходы между смежными ролями, рост сложности проектов)
   - Быстрое обучение и адаптация в предыдущих ролях
   - Нестандартный опыт, который релевантен для роли
   - Признаки высокой мотивации и готовности к вызовам

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

6. Напиши анализы:
   - analysis: краткий анализ соответствия (2-3 предложения)
   - potentialAnalysis: анализ потенциала кандидата (2-3 предложения)
   - careerTrajectoryAnalysis: анализ карьерной траектории (2-3 предложения)
   - hiddenFitAnalysis: анализ скрытых индикаторов соответствия, если они есть (1-2 предложения)

ВАЖНО:
- Фокусируйся на потенциале кандидата, а не только на формальном соответствии требованиям
- Выявляй "скрытых подходящих" — кандидатов с неидеальным резюме, но сильным потенциалом
- Анализируй карьерную логику: рост, деградация, скачки, смена ролей
- Помни: "Мы отбираем тех, кто реально справится с задачей, а не тех, кто красиво написал резюме"
- Все текстовые поля (analysis, potentialAnalysis и т.д.) должны быть в формате HTML с тегами: <p>, <strong>, <ul>/<li>, <br>`;
  }

  private extractFirstName(fullName: string | null): string {
    if (!fullName) return "Не указано";
    const parts = fullName.trim().split(/\s+/);
    return parts[0] || "Не указано";
  }

  private formatExperience(
    candidate: ResponseScreeningInput["candidate"],
  ): string | null {
    // Если есть profileData, извлекаем из него опыт
    if (candidate.profileData && typeof candidate.profileData === "object") {
      const data = candidate.profileData as Record<string, unknown>;

      // Проверяем наличие experience в profileData
      if (Array.isArray(data.experience)) {
        return data.experience
          .map((exp: unknown) => {
            if (typeof exp === "object" && exp !== null) {
              const e = exp as Record<string, unknown>;
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
    }

    return null;
  }
}
