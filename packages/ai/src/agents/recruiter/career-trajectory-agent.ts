/**
 * CareerTrajectoryAgent - AI агент для анализа карьерной траектории кандидата
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "../core/base-agent";
import { AgentType } from "../core/types";
import { CAREER_TRAJECTORY_AGENT_SYSTEM_PROMPT } from "./ranking/prompts";

/**
 * Структурированный опыт работы
 */

const workExperienceSchema = z.object({
  company: z.string(),
  position: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
  isCurrent: z.boolean().optional(),
});

/**
 * Входные данные для анализа карьерной траектории
 */
export const careerTrajectoryInputSchema = z.object({
  // Структурированный опыт работы (если доступен)
  workExperience: z.array(workExperienceSchema).optional(),

  // Текстовое описание опыта (fallback)
  experienceText: z.string().nullable().optional(),

  // Требования вакансии для контекста
  vacancyRequirements: z
    .object({
      job_title: z.string().optional(),
      summary: z.string().optional(),
      mandatory_requirements: z.array(z.string()).optional(),
      experience_years: z
        .object({
          min: z.number().nullable().optional(),
          description: z.string().optional(),
        })
        .optional(),
    })
    .optional(),

  // Навыки кандидата
  skills: z.array(z.string()).optional(),

  // Дополнительная информация
  coverLetter: z.string().nullable().optional(),
});

export type CareerTrajectoryInput = z.infer<typeof careerTrajectoryInputSchema>;

/**
 * Оценка по критерию
 */
const scoreWithReasoningSchema = z.object({
  score: z.number().int().min(0).max(100).nullable(),
  reasoning: z.string(),
});

/**
 * Выходные данные анализа карьерной траектории
 */
export const careerTrajectoryOutputSchema = z.object({
  careerTrajectoryType: z.enum([
    "growth",
    "stable",
    "decline",
    "jump",
    "role_change",
  ]),
  typeReasoning: z.string(),
  transitionLogicScore: scoreWithReasoningSchema,
  growthSpeedScore: scoreWithReasoningSchema,
  stabilityScore: scoreWithReasoningSchema,
  experienceQualityScore: scoreWithReasoningSchema,
  growthPotentialScore: scoreWithReasoningSchema,
  careerTrajectoryScore: scoreWithReasoningSchema,
  analysis: z.string(),
});

export type CareerTrajectoryOutput = z.infer<
  typeof careerTrajectoryOutputSchema
>;

/**
 * Агент для анализа карьерной траектории кандидата
 */
export class CareerTrajectoryAgent extends BaseAgent<
  CareerTrajectoryInput,
  CareerTrajectoryOutput
> {
  constructor(config: AgentConfig) {
    super(
      "CareerTrajectoryAgent",
      AgentType.EVALUATOR,
      CAREER_TRAJECTORY_AGENT_SYSTEM_PROMPT,
      careerTrajectoryOutputSchema,
      config,
    );
  }

  protected validate(input: CareerTrajectoryInput): boolean {
    // Проверяем наличие хотя бы одного источника данных об опыте
    return (
      (input.workExperience && input.workExperience.length > 0) ||
      !!input.experienceText
    );
  }

  protected buildPrompt(
    input: CareerTrajectoryInput,
    _context: unknown,
  ): string {
    const {
      workExperience,
      experienceText,
      vacancyRequirements,
      skills,
      coverLetter,
    } = input;

    // Форматируем опыт работы
    const experienceInfo = this.formatExperience(
      workExperience,
      experienceText,
    );

    // Форматируем требования вакансии
    const vacancyInfo = this.formatVacancyRequirements(vacancyRequirements);

    // Форматируем навыки
    const skillsInfo =
      skills && skills.length > 0 ? skills.join(", ") : "Не указаны";

    // Форматируем сопроводительное письмо
    const coverLetterInfo = coverLetter || "Отсутствует";

    return `АНАЛИЗ КАРЬЕРНОЙ ТРАЕКТОРИИ КАНДИДАТА

ОПЫТ РАБОТЫ:
${experienceInfo}

НАВЫКИ:
${skillsInfo}

СОПРОВОДИТЕЛЬНОЕ ПИСЬМО:
${coverLetterInfo}

${vacancyInfo}

ЗАДАЧА:
Проанализируй карьерную траекторию кандидата и определи:
1. Тип траектории (growth, stable, decline, jump, role_change)
2. Оценки по всем критериям (transitionLogicScore, growthSpeedScore, stabilityScore, experienceQualityScore, growthPotentialScore)
3. Общую оценку карьерной траектории (careerTrajectoryScore)
4. Детальный анализ с выявлением "скрытых подходящих" индикаторов (analysis)

Учитывай:
- Логичность переходов между ролями
- Скорость и стабильность роста
- Качество и релевантность опыта
- Потенциал для дальнейшего роста
- Неочевидные сигналы о силе кандидата (неидеальное резюме → сильный кандидат)

Будь объективным, но учитывай нюансы и контекст.`;
  }

  private formatExperience(
    workExperience?: CareerTrajectoryInput["workExperience"],
    experienceText?: string | null,
  ): string {
    if (workExperience && workExperience.length > 0) {
      return workExperience
        .map((exp, index) => {
          const period = exp.isCurrent
            ? `${exp.startDate || "?"} - настоящее время`
            : `${exp.startDate || "?"} - ${exp.endDate || "?"}`;
          return `${index + 1}. ${exp.position} в ${exp.company} (${period})
${exp.description || "Описание отсутствует"}`;
        })
        .join("\n\n");
    }

    if (experienceText) {
      return experienceText;
    }

    return "Опыт работы не указан";
  }

  private formatVacancyRequirements(
    vacancyRequirements?: CareerTrajectoryInput["vacancyRequirements"],
  ): string {
    if (!vacancyRequirements) {
      return "";
    }

    const parts: string[] = [];

    if (vacancyRequirements.job_title) {
      parts.push(`Целевая позиция: ${vacancyRequirements.job_title}`);
    }

    if (vacancyRequirements.summary) {
      parts.push(`Описание вакансии: ${vacancyRequirements.summary}`);
    }

    if (
      vacancyRequirements.mandatory_requirements &&
      vacancyRequirements.mandatory_requirements.length > 0
    ) {
      parts.push(
        `Обязательные требования:\n${vacancyRequirements.mandatory_requirements
          .map((r) => `- ${r}`)
          .join("\n")}`,
      );
    }

    if (
      vacancyRequirements.experience_years?.description ||
      vacancyRequirements.experience_years?.min
    ) {
      const expDesc =
        vacancyRequirements.experience_years.description ||
        `Минимум ${vacancyRequirements.experience_years.min} лет`;
      parts.push(`Требуемый опыт: ${expDesc}`);
    }

    return parts.length > 0
      ? `\nКОНТЕКСТ ВАКАНСИИ:\n${parts.join("\n\n")}`
      : "";
  }
}
