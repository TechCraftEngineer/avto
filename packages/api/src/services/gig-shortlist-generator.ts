/**
 * Сервис генерации шортлиста кандидатов для gig заданий
 *
 * Выбирает топ-кандидатов из ранжированного списка на основе
 * compositeScore и рекомендаций AI
 */

import { and, eq, gte, isNotNull } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response, responseScreening } from "@qbs-autonaim/db/schema";

/**
 * Контактная информация кандидата
 */
export interface GigContactInfo {
  email?: string;
  phone?: string;
  telegram?: string;
  platformProfile?: string;
}

/**
 * Опции генерации шортлиста для gig
 */
export interface GigShortlistOptions {
  minScore?: number; // По умолчанию: 70
  maxCandidates?: number; // По умолчанию: 8
  includeOnlyHighlyRecommended?: boolean; // По умолчанию: false
  prioritizeBudgetFit?: boolean; // По умолчанию: false
}

/**
 * Кандидат в gig-шортлисте
 */
export interface GigShortlistCandidate {
  responseId: string;
  name: string;
  contactInfo: GigContactInfo;
  // Ценовые предложения
  proposedPrice?: number;
  proposedDeliveryDays?: number;
  // Оценки AI
  compositeScore: number;
  priceScore?: number;
  deliveryScore?: number;
  skillsMatchScore?: number;
  experienceScore?: number;
  // Рекомендации
  recommendation:
    | "HIGHLY_RECOMMENDED"
    | "RECOMMENDED"
    | "NEUTRAL"
    | "NOT_RECOMMENDED";
  rankingAnalysis?: string;
  strengths: string[];
  weaknesses: string[];
  // Дополнительная информация
  coverLetter?: string;
  portfolioLinks?: string[];
  skills?: string[];
  experience?: string;
  createdAt: Date;
}

/**
 * Результат генерации gig-шортлиста
 */
export interface GigShortlist {
  gigId: string;
  candidates: GigShortlistCandidate[];
  totalCandidates: number;
  generatedAt: Date;
  options: GigShortlistOptions;
}

/**
 * Сервис для генерации шортлиста кандидатов для gig заданий
 */
export class GigShortlistGenerator {
  /**
   * Генерирует шортлист кандидатов для gig задания
   */
  async generateShortlist(
    gigId: string,
    options: GigShortlistOptions = {},
  ): Promise<GigShortlist> {
    const {
      minScore = 70,
      maxCandidates = 8,
      includeOnlyHighlyRecommended = false,
      prioritizeBudgetFit = false,
    } = options;

    // Получаем все ранжированные отклики для gig с JOIN к screening
    const responses = await db
      .select({
        id: response.id,
        candidateName: response.candidateName,
        email: response.email,
        phone: response.phone,
        telegramUsername: response.telegramUsername,
        profileUrl: response.profileUrl,
        proposedPrice: response.proposedPrice,
        proposedDeliveryDays: response.proposedDeliveryDays,
        portfolioLinks: response.portfolioLinks,
        coverLetter: response.coverLetter,
        skills: response.skills,
        createdAt: response.createdAt,
        // Поля из screening
        overallScore: responseScreening.overallScore,
        priceScore: responseScreening.priceScore,
        deliveryScore: responseScreening.deliveryScore,
        skillsMatchScore: responseScreening.skillsMatchScore,
        experienceScore: responseScreening.experienceScore,
        recommendation: responseScreening.recommendation,
        rankingAnalysis: responseScreening.rankingAnalysis,
        strengths: responseScreening.strengths,
        weaknesses: responseScreening.weaknesses,
      })
      .from(response)
      .innerJoin(
        responseScreening,
        eq(response.id, responseScreening.responseId),
      )
      .where(
        and(
          eq(response.entityType, "gig"),
          eq(response.entityId, gigId),
          gte(responseScreening.overallScore, minScore),
          isNotNull(responseScreening.overallScore),
        ),
      );

    // Фильтруем по рекомендациям если нужно
    let filteredResponses = responses;
    if (includeOnlyHighlyRecommended) {
      filteredResponses = responses.filter(
        (r) => r.recommendation === "HIGHLY_RECOMMENDED",
      );
    } else {
      // Исключаем NOT_RECOMMENDED
      filteredResponses = responses.filter(
        (r) => r.recommendation !== "NOT_RECOMMENDED",
      );
    }

    // Преобразуем в промежуточный формат для сортировки
    const candidatesForSorting: GigShortlistCandidate[] = filteredResponses.map(
      (response) => ({
        responseId: response.id,
        name: response.candidateName ?? "Имя не указано",
        contactInfo: {
          email: response.email ?? undefined,
          phone: response.phone ?? undefined,
          telegram: response.telegramUsername ?? undefined,
          platformProfile: response.profileUrl ?? undefined,
        },
        proposedPrice: response.proposedPrice ?? undefined,
        proposedDeliveryDays: response.proposedDeliveryDays ?? undefined,
        compositeScore: response.overallScore ?? 0,
        priceScore: response.priceScore ?? undefined,
        deliveryScore: response.deliveryScore ?? undefined,
        skillsMatchScore: response.skillsMatchScore ?? undefined,
        experienceScore: response.experienceScore ?? undefined,
        recommendation:
          response.recommendation as GigShortlistCandidate["recommendation"],
        rankingAnalysis: response.rankingAnalysis ?? undefined,
        strengths: response.strengths ?? [],
        weaknesses: response.weaknesses ?? [],
        coverLetter: response.coverLetter ?? undefined,
        portfolioLinks: (response.portfolioLinks as string[]) ?? undefined,
        skills: (response.skills as string[]) ?? undefined,
        createdAt: response.createdAt,
      }),
    );

    // Сортируем кандидатов
    const sortedCandidates = this.sortCandidates(
      candidatesForSorting,
      prioritizeBudgetFit,
    );

    // Ограничиваем количество кандидатов
    const candidates = sortedCandidates.slice(0, maxCandidates);

    return {
      gigId,
      candidates,
      totalCandidates: responses.length,
      generatedAt: new Date(),
      options: {
        minScore,
        maxCandidates,
        includeOnlyHighlyRecommended,
        prioritizeBudgetFit,
      },
    };
  }

  /**
   * Сортирует кандидатов по заданным критериям
   */
  private sortCandidates(
    candidates: GigShortlistCandidate[],
    prioritizeBudgetFit: boolean,
  ): GigShortlistCandidate[] {
    const sorted = [...candidates];

    if (prioritizeBudgetFit) {
      // Приоритет: compositeScore, затем priceScore, затем deliveryScore
      sorted.sort((a, b) => {
        // Сначала по compositeScore (убывание)
        const scoreDiff = (b.compositeScore ?? 0) - (a.compositeScore ?? 0);
        if (scoreDiff !== 0) return scoreDiff;

        // Затем по priceScore (убывание - лучшее соотношение цена/качество)
        const priceDiff = (b.priceScore ?? 0) - (a.priceScore ?? 0);
        if (priceDiff !== 0) return priceDiff;

        // Затем по deliveryScore (убывание)
        const deliveryDiff = (b.deliveryScore ?? 0) - (a.deliveryScore ?? 0);
        return deliveryDiff;
      });
    } else {
      // Стандартная сортировка: compositeScore, затем recommendation
      const recommendationPriority = {
        HIGHLY_RECOMMENDED: 4,
        RECOMMENDED: 3,
        NEUTRAL: 2,
        NOT_RECOMMENDED: 1,
      };

      sorted.sort((a, b) => {
        // Сначала по compositeScore (убывание)
        const scoreDiff = (b.compositeScore ?? 0) - (a.compositeScore ?? 0);
        if (scoreDiff !== 0) return scoreDiff;

        // Затем по recommendation priority (убывание)
        const recA =
          recommendationPriority[
            a.recommendation as keyof typeof recommendationPriority
          ] ?? 0;
        const recB =
          recommendationPriority[
            b.recommendation as keyof typeof recommendationPriority
          ] ?? 0;
        const recDiff = recB - recA;
        if (recDiff !== 0) return recDiff;

        // Наконец по дате отклика (сначала новые)
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    }

    return sorted;
  }
}
