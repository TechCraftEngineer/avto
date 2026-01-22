/**
 * PriorityAgent - AI агент для приоритизации кандидатов
 * Помогает рекрутеру определить, кого посмотреть первым
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "../../core/base-agent";
import { AgentType } from "../../core/types";
import type { RecruiterAgentContext } from "../core/types";
import { PRIORITY_AGENT_SYSTEM_PROMPT } from "./prompts";

/**
 * Входные данные для приоритизации
 */
export const priorityAgentInputSchema = z.object({
  responses: z.array(
    z.object({
      id: z.string(),
      fitScore: z.number().min(0).max(100),
      respondedAt: z.coerce.date(),
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
          detailedScore: z.number().min(0).max(100).optional(),
        })
        .optional(),
      status: z.string().optional(),
      hrSelectionStatus: z.string().nullable().optional(),
    }),
  ),
  vacancyId: z.string(),
});

export type PriorityAgentInput = z.infer<typeof priorityAgentInputSchema>;

/**
 * Выходные данные приоритизации
 */
export const priorityAgentOutputSchema = z.object({
  prioritized: z.array(
    z.object({
      responseId: z.string(),
      priorityScore: z.number().min(0).max(100),
      explanation: z.string(),
      reasons: z.array(z.string()).min(1).max(5),
    }),
  ),
});

export type PriorityAgentOutput = z.infer<typeof priorityAgentOutputSchema>;

/**
 * Агент для приоритизации кандидатов
 */
export class PriorityAgent extends BaseAgent<
  PriorityAgentInput,
  PriorityAgentOutput
> {
  constructor(config: AgentConfig) {
    super(
      "PriorityAgent",
      AgentType.CONTEXT_ANALYZER,
      PRIORITY_AGENT_SYSTEM_PROMPT,
      priorityAgentOutputSchema,
      config,
    );
  }

  protected validate(input: PriorityAgentInput): boolean {
    return (
      Array.isArray(input.responses) &&
      input.responses.length > 0 &&
      typeof input.vacancyId === "string" &&
      input.vacancyId.length > 0
    );
  }

  protected buildPrompt(
    input: PriorityAgentInput,
    context: RecruiterAgentContext,
  ): string {
    const responsesInfo = input.responses
      .map((r, idx) => {
        const riskInfo =
          r.riskFactors.length > 0
            ? `\n   Риски: ${r.riskFactors
                .map((rf) => `${rf.severity}: ${rf.description}`)
                .join(", ")}`
            : "\n   Риски: нет";
        const screeningInfo = r.screening
          ? `\n   Скрининг: score=${r.screening.score ?? "N/A"}, detailedScore=${r.screening.detailedScore ?? "N/A"}`
          : "\n   Скрининг: не проведен";
        const statusInfo = r.status
          ? `\n   Статус: ${r.status}`
          : "";
        const hrStatusInfo = r.hrSelectionStatus
          ? `\n   HR статус: ${r.hrSelectionStatus}`
          : "";

        return `Кандидат ${idx + 1} (ID: ${r.id}):
   fitScore: ${r.fitScore}
   Отклик: ${r.respondedAt.toISOString()}${riskInfo}${screeningInfo}${statusInfo}${hrStatusInfo}`;
      })
      .join("\n\n");

    const historyContext = this.buildHistoryContext(context);

    return `
Вакансия ID: ${input.vacancyId}
${context.currentVacancyId ? `Текущая вакансия в контексте: ${context.currentVacancyId}` : ""}

Список откликов для приоритизации (${input.responses.length} кандидатов):

${responsesInfo}

${historyContext}

Настройки компании:
- Название: ${context.recruiterCompanySettings?.name || "Не указано"}
- Стиль коммуникации: ${context.recruiterCompanySettings?.communicationStyle || "professional"}

Проанализируй список и определи приоритеты просмотра для рекрутера. Верни приоритизированный список с объяснениями.
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

  /**
   * Вычисляет приоритетный score на основе данных
   * Используется как fallback или для валидации AI результата
   */
  calculatePriorityScore(
    response: PriorityAgentInput["responses"][0],
  ): number {
    // Базовый score из fitScore (40%)
    let priorityScore = response.fitScore * 0.4;

    // Новизна отклика (20%)
    const now = Date.now();
    const respondedAt = response.respondedAt.getTime();
    const hoursSinceResponse = (now - respondedAt) / (1000 * 60 * 60);
    const freshnessScore = Math.max(0, 100 - hoursSinceResponse * 2); // Убывает на 2 пункта в час
    priorityScore += freshnessScore * 0.2;

    // Штраф за риски (20%)
    const highRiskCount = response.riskFactors.filter(
      (r) => r.severity === "high",
    ).length;
    const mediumRiskCount = response.riskFactors.filter(
      (r) => r.severity === "medium",
    ).length;
    const riskPenalty = Math.min(
      100,
      highRiskCount * 30 + mediumRiskCount * 10,
    );
    priorityScore += (100 - riskPenalty) * 0.2;

    // Бонус за скрининг (20%)
    const screeningBonus = response.screening ? 50 : 0;
    priorityScore += screeningBonus * 0.2;

    return Math.round(Math.min(100, Math.max(0, priorityScore)));
  }
}
