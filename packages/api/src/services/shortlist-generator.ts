/**
 * Сервис генерации шортлиста кандидатов
 *
 * Ранжирует фрилансеров на основе оценок анализа откликов и интервью.
 * Комбинирует оценки с весами: 40% анализ отклика, 60% интервью.
 */

import { db } from "@qbs-autonaim/db/client";
import type { ContactInfo } from "@qbs-autonaim/shared/server";

/**
 * Опции генерации шортлиста
 */
export interface ShortlistOptions {
  minScore?: number; // По умолчанию: 60
  maxCandidates?: number; // По умолчанию: 10
  sortBy?: "SCORE" | "EXPERIENCE" | "RESPONSE_DATE"; // По умолчанию: SCORE
}

/**
 * Кандидат в шортлисте
 */
export interface ShortlistCandidate {
  responseId: string;
  name: string;
  contactInfo: ContactInfo;
  overallScore: number;
  responseScore: number;
  interviewScore: number | null;
  keyHighlights: string[];
  redFlags: string[];
}

/**
 * Результат генерации шортлиста
 */
export interface Shortlist {
  vacancyId: string;
  candidates: ShortlistCandidate[];
  generatedAt: Date;
}

/**
 * Сервис для генерации шортлиста кандидатов
 */
export class ShortlistGenerator {
  /**
   * Генерирует шортлист кандидатов для вакансии
   */
  async generateShortlist(
    vacancyId: string,
    options: ShortlistOptions = {},
  ): Promise<Shortlist> {
    const { minScore = 60, maxCandidates = 10, sortBy = "SCORE" } = options;

    // Получаем все отклики для вакансии
    const responses = await db.query.response.findMany({
      where: (r, { eq, and }) =>
        and(eq(r.entityType, "vacancy"), eq(r.entityId, vacancyId)),
    });

    // Get all screenings separately
    const responseIds = responses.map((r) => r.id);
    const screenings =
      responseIds.length > 0
        ? await db.query.responseScreening.findMany({
            where: (screening, { inArray }) =>
              inArray(screening.responseId, responseIds),
          })
        : [];

    const screeningMap = new Map(screenings.map((s) => [s.responseId, s]));

    // Get all interviewSessions separately
    const sessions =
      responseIds.length > 0
        ? await db.query.interviewSession.findMany({
            where: (session, { inArray }) =>
              inArray(session.responseId, responseIds),
          })
        : [];

    const sessionMap = new Map(sessions.map((s) => [s.responseId, s]));

    // Get all interview scorings separately
    const sessionIds = sessions.map((s) => s.id);
    const interviewScorings =
      sessionIds.length > 0
        ? await db.query.interviewScoring.findMany({
            where: (scoring, { inArray }) =>
              inArray(scoring.interviewSessionId, sessionIds),
          })
        : [];

    const interviewScoringMap = new Map(
      interviewScorings.map((s) => [s.interviewSessionId, s]),
    );

    // Преобразуем в кандидатов с комбинированными оценками
    const candidates: ShortlistCandidate[] = responses
      .map((response) => {
        const screening = screeningMap.get(response.id);
        const session = sessionMap.get(response.id);
        const interviewScoring = session
          ? interviewScoringMap.get(session.id)
          : null;

        // Получаем оценку анализа отклика
        const responseScore = screening?.overallScore ?? 0;

        // Получаем оценку интервью (если есть завершённое интервью)
        const interviewScore = interviewScoring
          ? (interviewScoring.rating ?? Math.round(interviewScoring.score / 20))
          : null;

        // Рассчитываем общую оценку
        const overallScore = this.calculateOverallScore(
          responseScore,
          interviewScore,
        );

        // Извлекаем контактную информацию
        const contactInfo = this.extractContactInfo(response);

        // Извлекаем ключевые особенности и красные флаги
        const { keyHighlights, redFlags } = this.extractHighlightsAndFlags(
          screening?.overallAnalysis,
          interviewScoring?.analysis,
        );

        return {
          responseId: response.id,
          name: response.candidateName ?? "Имя не указано",
          contactInfo,
          overallScore,
          responseScore,
          interviewScore,
          keyHighlights,
          redFlags,
        };
      })
      .filter((candidate) => candidate.overallScore >= minScore);

    // Сортируем кандидатов
    const sortedCandidates = this.sortCandidates(candidates, sortBy);

    // Ограничиваем количество кандидатов
    const topCandidates = sortedCandidates.slice(0, maxCandidates);

    return {
      vacancyId,
      candidates: topCandidates,
      generatedAt: new Date(),
    };
  }

  /**
   * Рассчитывает общую оценку кандидата
   */
  private calculateOverallScore(
    responseScore: number,
    interviewScore: number | null,
  ): number {
    if (interviewScore === null) {
      return responseScore;
    }
    const weighted = responseScore * 0.4 + interviewScore * 0.6;
    return Math.round(weighted);
  }

  /**
   * Извлекает контактную информацию из отклика
   */
  private extractContactInfo(response: {
    phone?: string | null;
    telegramUsername?: string | null;
    profileUrl?: string | null;
    contacts?: Record<string, unknown> | null;
  }): ContactInfo {
    const contactInfo: ContactInfo = {};

    if (response.phone) {
      contactInfo.phone = response.phone;
    }

    if (response.telegramUsername) {
      contactInfo.telegram = response.telegramUsername;
    }

    if (response.profileUrl) {
      contactInfo.platformProfile = response.profileUrl;
    }

    if (response.contacts && typeof response.contacts === "object") {
      const email = (response.contacts as Record<string, unknown>).email;
      if (typeof email === "string") {
        contactInfo.email = email;
      }
    }

    return contactInfo;
  }

  /**
   * Извлекает ключевые особенности и красные флаги из анализов
   */
  private extractHighlightsAndFlags(
    screeningAnalysis?: string | null,
    interviewAnalysis?: string | null,
  ): { keyHighlights: string[]; redFlags: string[] } {
    const keyHighlights: string[] = [];
    const redFlags: string[] = [];

    const combinedAnalysis = [screeningAnalysis, interviewAnalysis]
      .filter(Boolean)
      .join("\n");

    if (!combinedAnalysis) {
      return { keyHighlights, redFlags };
    }

    // Ищем позитивные маркеры
    const positivePatterns = [
      /(?:сильные стороны|преимущества|плюсы):\s*([^\n]+)/gi,
      /(?:опыт|навыки):\s*([^\n]+)/gi,
      /(?:рекомендуется|подходит)/gi,
    ];

    for (const pattern of positivePatterns) {
      const matches = combinedAnalysis.matchAll(pattern);
      for (const match of matches) {
        const highlight = match[1] || match[0];
        if (highlight && highlight.length > 10) {
          keyHighlights.push(highlight.trim());
        }
      }
    }

    // Ищем негативные маркеры
    const negativePatterns = [
      /(?:слабые стороны|недостатки|минусы):\s*([^\n]+)/gi,
      /(?:красные флаги|проблемы|риски):\s*([^\n]+)/gi,
      /(?:не рекомендуется|не подходит)/gi,
    ];

    for (const pattern of negativePatterns) {
      const matches = combinedAnalysis.matchAll(pattern);
      for (const match of matches) {
        const flag = match[1] || match[0];
        if (flag && flag.length > 10) {
          redFlags.push(flag.trim());
        }
      }
    }

    return { keyHighlights, redFlags };
  }

  /**
   * Сортирует кандидатов по выбранному критерию
   */
  private sortCandidates(
    candidates: ShortlistCandidate[],
    sortBy: "SCORE" | "EXPERIENCE" | "RESPONSE_DATE",
  ): ShortlistCandidate[] {
    const sorted = [...candidates];

    switch (sortBy) {
      case "SCORE":
        sorted.sort((a, b) => b.overallScore - a.overallScore);
        break;

      case "EXPERIENCE":
        sorted.sort((a, b) => {
          if (a.interviewScore !== null && b.interviewScore === null) return -1;
          if (a.interviewScore === null && b.interviewScore !== null) return 1;
          return b.overallScore - a.overallScore;
        });
        break;

      case "RESPONSE_DATE":
        sorted.sort((a, b) => b.overallScore - a.overallScore);
        break;
    }

    return sorted;
  }
}
