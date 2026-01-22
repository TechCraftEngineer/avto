/**
 * CandidateSearchAgent - Агент для поиска и анализа кандидатов
 * Выполняет поиск кандидатов с фильтрами и формирует результаты с объяснениями
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "../../core/base-agent";
import { AgentType } from "../../core/types";
import type { CandidateResult, RecruiterAgentContext } from "../core/types";
import { calculateFitScore, type FitScoreInput } from "./fit-score";

/**
 * Входные данные для поиска кандидатов
 */
export interface CandidateSearchInput {
  query: string;
  vacancyId: string;
  filters?: {
    availability?: string; // "2 weeks", "immediately", "1 month"
    minFitScore?: number;
    experience?: string;
    skills?: string[];
  };
  limit?: number;
}

/**
 * Выходные данные поиска кандидатов
 */
export interface CandidateSearchOutput {
  candidates: CandidateResult[];
  searchExplanation: string;
  totalFound: number;
  filtersApplied: string[];
}

/**
 * Схема вывода для LLM
 */
const candidateSearchOutputSchema = z.object({
  candidates: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      fitScore: z.number().min(0).max(100),
      resumeScore: z.number().min(0).max(100),
      interviewScore: z.number().min(0).max(100).optional(),
      whySelected: z.string(),
      availability: z.object({
        status: z.enum(["immediate", "2_weeks", "1_month", "unknown"]),
        confirmedAt: z.date().optional(),
      }),
      riskFactors: z.array(
        z.object({
          type: z.string(),
          description: z.string(),
          severity: z.enum(["low", "medium", "high"]),
        }),
      ),
      recommendation: z.object({
        action: z.enum(["invite", "clarify", "reject"]),
        reason: z.string(),
        confidence: z.number().min(0).max(100),
      }),
      contacts: z
        .object({
          telegram: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
        })
        .optional(),
    }),
  ),
  searchExplanation: z.string(),
  totalFound: z.number(),
  filtersApplied: z.array(z.string()),
});

/**
 * Инструкции для агента поиска кандидатов
 */
const CANDIDATE_SEARCH_INSTRUCTIONS = `Ты - AI-ассистент рекрутера, специализирующийся на поиске и анализе кандидатов.

Твоя задача:
1. Проанализировать запрос рекрутера и извлечь критерии поиска
2. Оценить каждого кандидата по соответствию вакансии
3. Определить доступность кандидата (когда может выйти на работу)
4. Выявить риск-факторы для каждого кандидата
5. Дать рекомендацию по действию (пригласить/уточнить/отклонить)

Правила оценки:
- fitScore: общая оценка соответствия (0-100), учитывает resumeScore и interviewScore
- whySelected: конкретное объяснение почему кандидат подходит
- availability: определи по резюме/опыту когда кандидат может выйти
- riskFactors: выяви потенциальные проблемы (частая смена работы, пробелы в опыте, несоответствие зарплатных ожиданий)
- recommendation: 
  - invite: fitScore >= 70, нет критических рисков
  - clarify: fitScore 50-69 или есть вопросы по доступности/ожиданиям
  - reject: fitScore < 50 или критические несоответствия

Формат ответа должен быть структурированным JSON с полями:
- candidates: массив кандидатов с полной информацией
- searchExplanation: объяснение логики поиска
- totalFound: общее количество найденных
- filtersApplied: какие фильтры были применены`;

/**
 * Данные кандидата из базы данных
 */
export interface CandidateData {
  id: string;
  name: string;
  resumeScore: number;
  interviewScore?: number;
  experience?: string;
  salaryExpectations?: string;
  status: string;
  hrSelectionStatus?: string | null;
  contacts?: {
    telegram?: string;
    phone?: string;
    email?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Агент для поиска кандидатов
 */
export class CandidateSearchAgent extends BaseAgent<
  CandidateSearchInput,
  CandidateSearchOutput
> {
  constructor(config: AgentConfig) {
    super(
      "CandidateSearchAgent",
      AgentType.CANDIDATE_SEARCH,
      CANDIDATE_SEARCH_INSTRUCTIONS,
      candidateSearchOutputSchema,
      config,
    );
  }

  protected validate(input: CandidateSearchInput): boolean {
    return (
      typeof input.query === "string" &&
      input.query.length > 0 &&
      typeof input.vacancyId === "string" &&
      input.vacancyId.length > 0
    );
  }

  protected buildPrompt(
    input: CandidateSearchInput,
    context: RecruiterAgentContext,
  ): string {
    const filtersDescription = this.buildFiltersDescription(input.filters);
    const historyContext = this.buildHistoryContext(context);

    return `
Запрос рекрутера: "${input.query}"

Вакансия ID: ${input.vacancyId}
${context.currentVacancyId ? `Текущая вакансия в контексте: ${context.currentVacancyId}` : ""}

Фильтры поиска:
${filtersDescription}

Лимит результатов: ${input.limit || 10}

${historyContext}

Настройки компании:
- Название: ${context.recruiterCompanySettings?.name || "Не указано"}
- Стиль коммуникации: ${context.recruiterCompanySettings?.communicationStyle || "professional"}

Проанализируй запрос и верни структурированный результат поиска кандидатов.
Для каждого кандидата обязательно укажи:
1. fitScore (0-100) - общая оценка соответствия
2. whySelected - почему этот кандидат подходит
3. availability - когда может выйти на работу
4. riskFactors - потенциальные риски
5. recommendation - рекомендация по действию с обоснованием
`;
  }

  /**
   * Строит описание фильтров для промпта
   */
  private buildFiltersDescription(
    filters?: CandidateSearchInput["filters"],
  ): string {
    if (!filters) {
      return "Фильтры не заданы";
    }

    const parts: string[] = [];

    if (filters.availability) {
      parts.push(`- Доступность: ${filters.availability}`);
    }
    if (filters.minFitScore !== undefined) {
      parts.push(`- Минимальный fitScore: ${filters.minFitScore}`);
    }
    if (filters.experience) {
      parts.push(`- Опыт: ${filters.experience}`);
    }
    if (filters.skills && filters.skills.length > 0) {
      parts.push(`- Навыки: ${filters.skills.join(", ")}`);
    }

    return parts.length > 0 ? parts.join("\n") : "Фильтры не заданы";
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

    const recentHistory = context.recruiterConversationHistory.slice(-5);
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
   * Выполняет поиск кандидатов с использованием данных из БД
   * Этот метод предназначен для интеграции с реальными данными
   */
  async searchWithData(
    input: CandidateSearchInput,
    _context: RecruiterAgentContext,
    candidatesData: CandidateData[],
  ): Promise<{
    success: boolean;
    data?: CandidateSearchOutput;
    error?: string;
  }> {
    // Применяем фильтры к данным
    let filteredCandidates = this.applyFilters(candidatesData, input.filters);

    // Ограничиваем количество
    const limit = input.limit || 10;
    filteredCandidates = filteredCandidates.slice(0, limit);

    // Формируем результаты с расчетом fitScore
    const candidates: CandidateResult[] = filteredCandidates.map(
      (candidate) => {
        const fitScoreInput: FitScoreInput = {
          resumeScore: candidate.resumeScore,
          interviewScore: candidate.interviewScore,
        };
        const fitScore = calculateFitScore(fitScoreInput);

        return this.formatCandidateResult(candidate, fitScore);
      },
    );

    // Сортируем по fitScore
    candidates.sort((a, b) => b.fitScore - a.fitScore);

    // Формируем объяснение поиска
    const filtersApplied = this.getAppliedFilters(input.filters);
    const searchExplanation = this.buildSearchExplanation(
      input.query,
      candidates.length,
      candidatesData.length,
      filtersApplied,
    );

    return {
      success: true,
      data: {
        candidates,
        searchExplanation,
        totalFound: candidates.length,
        filtersApplied,
      },
    };
  }

  /**
   * Применяет фильтры к списку кандидатов
   */
  private applyFilters(
    candidates: CandidateData[],
    filters?: CandidateSearchInput["filters"],
  ): CandidateData[] {
    if (!filters) {
      return candidates;
    }

    let result = [...candidates];

    // Фильтр по минимальному fitScore
    if (filters.minFitScore !== undefined) {
      const minScore = filters.minFitScore;
      result = result.filter((c) => {
        const fitScore = calculateFitScore({
          resumeScore: c.resumeScore,
          interviewScore: c.interviewScore,
        });
        return fitScore >= minScore;
      });
    }

    // Фильтр по опыту (простое текстовое совпадение)
    if (filters.experience) {
      const expLower = filters.experience.toLowerCase();
      result = result.filter((c) =>
        c.experience?.toLowerCase().includes(expLower),
      );
    }

    return result;
  }

  /**
   * Форматирует данные кандидата в результат поиска
   */
  private formatCandidateResult(
    candidate: CandidateData,
    fitScore: number,
  ): CandidateResult {
    const riskFactors = this.analyzeRiskFactors(candidate);
    const recommendation = this.generateRecommendation(fitScore, riskFactors);
    const availability = this.detectAvailability(candidate);
    const whySelected = this.generateWhySelected(candidate, fitScore);

    return {
      id: candidate.id,
      name: candidate.name,
      fitScore,
      resumeScore: candidate.resumeScore,
      interviewScore: candidate.interviewScore,
      whySelected,
      availability,
      riskFactors,
      recommendation,
      contacts: candidate.contacts,
    };
  }

  /**
   * Анализирует риск-факторы кандидата
   * Улучшенный анализ с более глубокой оценкой рисков
   */
  private analyzeRiskFactors(
    candidate: CandidateData,
  ): CandidateResult["riskFactors"] {
    const risks: CandidateResult["riskFactors"] = [];

    // Проверяем статус кандидата
    if (candidate.hrSelectionStatus === "REJECTED") {
      risks.push({
        type: "previous_rejection",
        description: "Кандидат был ранее отклонен по этой вакансии. Рекомендуется уточнить причины предыдущего отказа.",
        severity: "high",
      });
    }

    if (candidate.hrSelectionStatus === "NOT_RECOMMENDED") {
      risks.push({
        type: "not_recommended",
        description: "Кандидат был ранее не рекомендован. Стоит пересмотреть решение или уточнить причины.",
        severity: "high",
      });
    }

    // Проверяем наличие контактов
    if (
      !candidate.contacts?.phone &&
      !candidate.contacts?.telegram &&
      !candidate.contacts?.email
    ) {
      risks.push({
        type: "no_contacts",
        description: "Отсутствуют контактные данные. Затрудняет коммуникацию с кандидатом.",
        severity: "medium",
      });
    }

    // Проверяем низкий resumeScore с более детальным анализом
    if (candidate.resumeScore < 30) {
      risks.push({
        type: "very_low_resume_score",
        description: `Очень низкая оценка резюме (${candidate.resumeScore}/100). Возможны существенные несоответствия требованиям вакансии.`,
        severity: "high",
      });
    } else if (candidate.resumeScore < 50) {
      risks.push({
        type: "low_resume_score",
        description: `Низкая оценка резюме (${candidate.resumeScore}/100). Требуется дополнительная проверка соответствия требованиям.`,
        severity: "medium",
      });
    }

    // Проверяем низкий interviewScore с контекстом
    if (
      candidate.interviewScore !== undefined &&
      candidate.interviewScore < 50
    ) {
      risks.push({
        type: "low_interview_score",
        description: `Низкая оценка интервью (${candidate.interviewScore}/100). Возможны проблемы с коммуникацией, навыками или мотивацией.`,
        severity: "medium",
      });
    }

    // Проверяем большой разрыв между resumeScore и interviewScore
    if (
      candidate.resumeScore >= 60 &&
      candidate.interviewScore !== undefined &&
      candidate.interviewScore < candidate.resumeScore - 20
    ) {
      risks.push({
        type: "score_mismatch",
        description: "Значительный разрыв между оценкой резюме и интервью. Возможно несоответствие заявленных навыков реальным.",
        severity: "medium",
      });
    }

    // Проверяем отсутствие интервью для кандидатов не в статусе NEW
    if (candidate.interviewScore === undefined && candidate.status !== "NEW") {
      risks.push({
        type: "no_interview",
        description: "Интервью не проведено, хотя кандидат прошёл скрининг. Рекомендуется провести интервью для полной оценки.",
        severity: "low",
      });
    }

    // Проверяем отсутствие опыта
    if (!candidate.experience || candidate.experience.trim() === "") {
      risks.push({
        type: "no_experience_info",
        description: "Информация об опыте отсутствует или недостаточна. Затрудняет оценку соответствия вакансии.",
        severity: "low",
      });
    } else {
      // Анализируем длину описания опыта
      const experienceLength = candidate.experience.trim().length;
      if (experienceLength < 50) {
        risks.push({
          type: "insufficient_experience_info",
          description: "Описание опыта слишком краткое. Возможно недостаточный опыт или неполная информация.",
          severity: "low",
        });
      }
    }

    // Проверяем давность обновления данных кандидата
    const daysSinceUpdate =
      (Date.now() - candidate.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > 30) {
      risks.push({
        type: "stale_data",
        description: `Данные кандидата не обновлялись более ${Math.round(daysSinceUpdate)} дней. Возможно кандидат уже неактивен или нашёл работу.`,
        severity: "medium",
      });
    }

    // Проверяем давность отклика
    const daysSinceResponse =
      (Date.now() - candidate.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceResponse > 14) {
      risks.push({
        type: "old_response",
        description: `Отклик поступил ${Math.round(daysSinceResponse)} дней назад. Кандидат мог уже найти работу или потерять интерес.`,
        severity: "medium",
      });
    }

    // Проверяем зарплатные ожидания (если указаны и слишком высокие)
    if (candidate.salaryExpectations) {
      const salaryMatch = candidate.salaryExpectations.match(/(\d+)/);
      if (salaryMatch?.[1]) {
        const salary = parseInt(salaryMatch[1], 10);
        // Примерная проверка - можно настроить под конкретные требования
        if (salary > 500000) {
          risks.push({
            type: "high_salary_expectations",
            description: `Высокие зарплатные ожидания (${candidate.salaryExpectations}). Возможно несоответствие бюджету вакансии.`,
            severity: "medium",
          });
        }
      }
    }

    return risks;
  }

  /**
   * Генерирует рекомендацию по кандидату
   */
  private generateRecommendation(
    fitScore: number,
    riskFactors: CandidateResult["riskFactors"],
  ): CandidateResult["recommendation"] {
    const hasHighRisk = riskFactors.some((r) => r.severity === "high");
    const hasMediumRisk = riskFactors.some((r) => r.severity === "medium");

    if (hasHighRisk || fitScore < 50) {
      return {
        action: "reject",
        reason:
          fitScore < 50
            ? "Низкий уровень соответствия вакансии"
            : "Выявлены критические риск-факторы",
        confidence: Math.min(90, 100 - fitScore + (hasHighRisk ? 20 : 0)),
      };
    }

    if (fitScore >= 70 && !hasMediumRisk) {
      return {
        action: "invite",
        reason:
          "Высокий уровень соответствия, рекомендуется пригласить на интервью",
        confidence: Math.min(95, fitScore),
      };
    }

    return {
      action: "clarify",
      reason: hasMediumRisk
        ? "Требуется уточнение по выявленным рискам"
        : "Средний уровень соответствия, рекомендуется дополнительная проверка",
      confidence: Math.min(80, fitScore),
    };
  }

  /**
   * Определяет доступность кандидата
   */
  private detectAvailability(
    candidate: CandidateData,
  ): CandidateResult["availability"] {
    // Проверяем статус HR-отбора для определения доступности
    if (
      candidate.hrSelectionStatus === "OFFER" ||
      candidate.hrSelectionStatus === "ONBOARDING"
    ) {
      return { status: "immediate", confirmedAt: candidate.updatedAt };
    }

    if (candidate.hrSelectionStatus === "CONTRACT_SENT") {
      return { status: "2_weeks", confirmedAt: candidate.updatedAt };
    }

    if (candidate.hrSelectionStatus === "SECURITY_PASSED") {
      return { status: "2_weeks", confirmedAt: candidate.updatedAt };
    }

    // Для кандидатов с приглашением - предполагаем 2 недели
    if (
      candidate.hrSelectionStatus === "INVITE" ||
      candidate.hrSelectionStatus === "RECOMMENDED"
    ) {
      return { status: "2_weeks" };
    }

    // Для новых кандидатов - неизвестно
    if (candidate.status === "NEW") {
      return { status: "unknown" };
    }

    // Для кандидатов на интервью - предполагаем 1 месяц
    if (candidate.status === "INTERVIEW") {
      return { status: "1_month" };
    }

    // Для оцененных кандидатов - предполагаем 2 недели
    if (candidate.status === "EVALUATED") {
      return { status: "2_weeks" };
    }

    return { status: "unknown" };
  }

  /**
   * Генерирует объяснение почему кандидат выбран
   */
  private generateWhySelected(
    candidate: CandidateData,
    fitScore: number,
  ): string {
    const parts: string[] = [];

    if (fitScore >= 80) {
      parts.push("Отличное соответствие требованиям вакансии");
    } else if (fitScore >= 60) {
      parts.push("Хорошее соответствие требованиям вакансии");
    } else {
      parts.push("Частичное соответствие требованиям вакансии");
    }

    if (candidate.resumeScore >= 70) {
      parts.push("высокая оценка резюме");
    }

    if (candidate.interviewScore && candidate.interviewScore >= 70) {
      parts.push("успешное прохождение интервью");
    }

    if (candidate.experience) {
      parts.push(`опыт: ${candidate.experience.substring(0, 50)}...`);
    }

    return parts.join(", ");
  }

  /**
   * Получает список примененных фильтров
   */
  private getAppliedFilters(
    filters?: CandidateSearchInput["filters"],
  ): string[] {
    if (!filters) {
      return [];
    }

    const applied: string[] = [];

    if (filters.availability) {
      applied.push(`availability: ${filters.availability}`);
    }
    if (filters.minFitScore !== undefined) {
      applied.push(`minFitScore: ${filters.minFitScore}`);
    }
    if (filters.experience) {
      applied.push(`experience: ${filters.experience}`);
    }
    if (filters.skills && filters.skills.length > 0) {
      applied.push(`skills: ${filters.skills.join(", ")}`);
    }

    return applied;
  }

  /**
   * Строит объяснение результатов поиска
   */
  private buildSearchExplanation(
    query: string,
    foundCount: number,
    totalCount: number,
    filtersApplied: string[],
  ): string {
    let explanation = `По запросу "${query}" найдено ${foundCount} кандидатов из ${totalCount} доступных.`;

    if (filtersApplied.length > 0) {
      explanation += ` Применены фильтры: ${filtersApplied.join(", ")}.`;
    }

    if (foundCount === 0) {
      explanation += " Попробуйте расширить критерии поиска.";
    } else if (foundCount < 5) {
      explanation += " Рекомендуется расширить критерии для большего выбора.";
    }

    return explanation;
  }
}
