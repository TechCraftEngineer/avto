/**
 * InterviewQuestionsAgent - AI агент для генерации вопросов интервью
 * Помогает рекрутеру подготовить персонализированные вопросы
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "../../core/base-agent";
import { AgentType } from "../../core/types";
import type { RecruiterAgentContext } from "../core/types";
import { INTERVIEW_QUESTIONS_AGENT_SYSTEM_PROMPT } from "./prompts";

/**
 * Входные данные для генерации вопросов
 */
export const interviewQuestionsAgentInputSchema = z.object({
  candidateId: z.string(),
  responseId: z.string(),
  vacancyId: z.string(),
  candidateData: z.object({
    resume: z.string().nullable().optional(),
    experience: z.string().nullable().optional(),
    coverLetter: z.string().nullable().optional(),
    riskFactors: z.array(
      z.object({
        type: z.string(),
        description: z.string(),
        severity: z.enum(["low", "medium", "high"]),
      }),
    ),
    screening: z
      .object({
        score: z.number().min(0).max(100).optional(),
        analysis: z.string().nullable().optional(),
      })
      .optional(),
  }),
  vacancyData: z.object({
    title: z.string(),
    requirements: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
  }),
});

export type InterviewQuestionsAgentInput = z.infer<
  typeof interviewQuestionsAgentInputSchema
>;

/**
 * Выходные данные генерации вопросов
 */
export const interviewQuestionsAgentOutputSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      purpose: z.enum([
        "risk_clarification",
        "skill_verification",
        "culture_fit",
        "experience_deepening",
      ]),
      relatedRisk: z.string().nullable().optional(),
    }),
  ),
  explanation: z.string(),
});

export type InterviewQuestionsAgentOutput = z.infer<
  typeof interviewQuestionsAgentOutputSchema
>;

/**
 * Агент для генерации вопросов интервью
 */
export class InterviewQuestionsAgent extends BaseAgent<
  InterviewQuestionsAgentInput,
  InterviewQuestionsAgentOutput
> {
  constructor(config: AgentConfig) {
    super(
      "InterviewQuestionsAgent",
      AgentType.CONTEXT_ANALYZER,
      INTERVIEW_QUESTIONS_AGENT_SYSTEM_PROMPT,
      interviewQuestionsAgentOutputSchema,
      config,
    );
  }

  protected validate(input: InterviewQuestionsAgentInput): boolean {
    return (
      typeof input.candidateId === "string" &&
      input.candidateId.length > 0 &&
      typeof input.vacancyId === "string" &&
      input.vacancyId.length > 0 &&
      typeof input.vacancyData.title === "string" &&
      input.vacancyData.title.length > 0
    );
  }

  protected buildPrompt(
    input: InterviewQuestionsAgentInput,
    context: RecruiterAgentContext,
  ): string {
    const riskInfo =
      input.candidateData.riskFactors.length > 0
        ? input.candidateData.riskFactors
            .map(
              (rf) =>
                `- ${rf.severity.toUpperCase()}: ${rf.description} (тип: ${rf.type})`,
            )
            .join("\n")
        : "Риски не выявлены";

    const resumeInfo = input.candidateData.resume
      ? `Резюме:\n${input.candidateData.resume.substring(0, 1000)}${input.candidateData.resume.length > 1000 ? "..." : ""}`
      : "Резюме не предоставлено";

    const experienceInfo = input.candidateData.experience
      ? `Опыт:\n${input.candidateData.experience.substring(0, 500)}${input.candidateData.experience.length > 500 ? "..." : ""}`
      : "Информация об опыте отсутствует";

    const coverLetterInfo = input.candidateData.coverLetter
      ? `Сопроводительное письмо:\n${input.candidateData.coverLetter.substring(0, 500)}${input.candidateData.coverLetter.length > 500 ? "..." : ""}`
      : "Сопроводительное письмо отсутствует";

    const screeningInfo = input.candidateData.screening
      ? `Результаты скрининга:\nОценка: ${input.candidateData.screening.score ?? "N/A"}\nАнализ: ${input.candidateData.screening.analysis?.substring(0, 500) ?? "N/A"}`
      : "Скрининг не проведен";

    const vacancyRequirements = input.vacancyData.requirements
      ? `Требования:\n${input.vacancyData.requirements.substring(0, 1000)}${input.vacancyData.requirements.length > 1000 ? "..." : ""}`
      : "Требования не указаны";

    const vacancyDescription = input.vacancyData.description
      ? `Описание:\n${input.vacancyData.description.substring(0, 500)}${input.vacancyData.description.length > 500 ? "..." : ""}`
      : "";

    const historyContext = this.buildHistoryContext(context);

    return `
Кандидат ID: ${input.candidateId}
Отклик ID: ${input.responseId}
Вакансия: ${input.vacancyData.title}
Вакансия ID: ${input.vacancyId}

${vacancyDescription}

${vacancyRequirements}

ДАННЫЕ КАНДИДАТА:

${resumeInfo}

${experienceInfo}

${coverLetterInfo}

ВЫЯВЛЕННЫЕ РИСКИ:
${riskInfo}

${screeningInfo}

${historyContext}

Настройки компании:
- Название: ${context.recruiterCompanySettings?.name || "Не указано"}
- Стиль коммуникации: ${context.recruiterCompanySettings?.communicationStyle || "professional"}

Сгенерируй персонализированные вопросы для интервью с этим кандидатом. Учитывай:
1. Выявленные риски (для уточнения)
2. Требования вакансии (для проверки навыков)
3. Опыт кандидата (для углубления)
4. Стадию процесса найма

Верни 5-8 вопросов с объяснением стратегии интервью.
`;
  }

  /**
   * Строит контекст из истории диалога
   */
  private buildHistoryContext(context: RecruiterAgentContext): string {
    if (
      !context.recruiterConversationHistory ||
      context.recruiterConversationHistory.length === 0
    ) {
      return "";
    }

    const recentHistory = context.recruiterConversationHistory.slice(-3);
    const historyText = recentHistory
      .map(
        (msg) => `${msg.role === "user" ? "Рекрутер" : "AI"}: ${msg.content}`,
      )
      .join("\n");

    return `
Контекст диалога (последние сообщения):
${historyText}
`;
  }
}
