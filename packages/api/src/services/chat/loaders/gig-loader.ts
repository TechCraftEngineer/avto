/**
 * Загрузчик контекста для gig заданий
 * Использует универсальные таблицы откликов
 */

import {
  and,
  eq,
  gig,
  interviewScoring,
  response,
  responseScreening,
} from "@qbs-autonaim/db";
import type { db } from "@qbs-autonaim/db/client";
import type { ChatContext, ContextLoader } from "../types";

interface CandidateData {
  id: string;
  candidateId: string;
  candidateName: string | null;
  proposedPrice: number | null;

  proposedDeliveryDays: number | null;
  coverLetter: string | null;
  experience: string | null;
  skills: string[] | null;
  rating: string | null;
  status: string;
  hrSelectionStatus: string | null;
  compositeScore: number | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  recommendation: string | null;
  screeningScore: number | null;
  screeningDetailedScore: number | null;
  screeningAnalysis: string | null;
  interviewScore: number | null;
  interviewDetailedScore: number | null;
  interviewAnalysis: string | null;
}

export class GigContextLoader implements ContextLoader {
  async loadContext(
    database: typeof db,
    gigId: string,
  ): Promise<ChatContext | null> {
    // Загрузка основного контекста gig
    const gigData = await database.query.gig.findFirst({
      where: eq(gig.id, gigId),
      columns: {
        id: true,
        workspaceId: true,
        title: true,
        description: true,
        requirements: true,
        type: true,
        budgetMin: true,
        budgetMax: true,

        deadline: true,
        estimatedDuration: true,
        customBotInstructions: true,
      },
    });

    if (!gigData) {
      return null;
    }

    // Загрузка откликов кандидатов из универсальной таблицы
    const responses = await database.query.response.findMany({
      where: and(eq(response.entityType, "gig"), eq(response.entityId, gigId)),
      columns: {
        id: true,
        candidateId: true,
        candidateName: true,
        proposedPrice: true,

        proposedDeliveryDays: true,
        coverLetter: true,
        experience: true,
        skills: true,
        rating: true,
        status: true,
        hrSelectionStatus: true,
        compositeScore: true,
        strengths: true,
        weaknesses: true,
        recommendation: true,
      },
    });

    const responseIds = responses.map((r) => r.id);

    // Загрузка screening данных из универсальной таблицы
    const screenings: Array<{
      responseId: string;
      score: number;
      detailedScore: number;
      analysis: string | null;
    }> = [];

    if (responseIds.length > 0) {
      for (const responseId of responseIds) {
        const screening = await database.query.responseScreening.findFirst({
          where: eq(responseScreening.responseId, responseId),
          columns: {
            responseId: true,
            score: true,
            detailedScore: true,
            analysis: true,
          },
        });
        if (screening) {
          screenings.push(screening);
        }
      }
    }

    const screeningMap = new Map(screenings.map((s) => [s.responseId, s]));

    // Загрузка interview данных (пока остается в старой таблице)
    const interviews: Array<{
      responseId: string | null;
      score: number;
      rating: number | null;
      analysis: string | null;
    }> = [];

    if (responseIds.length > 0) {
      for (const responseId of responseIds) {
        const interview = await database.query.interviewScoring.findFirst({
          where: eq(interviewScoring.responseId, responseId),
          columns: {
            responseId: true,
            score: true,
            rating: true,
            analysis: true,
          },
        });
        if (interview) {
          interviews.push(interview);
        }
      }
    }

    const interviewMap = new Map(
      interviews
        .filter((i) => i.responseId !== null)
        .map((i) => [i.responseId as string, i]),
    );

    // Формирование данных кандидатов
    const candidates: CandidateData[] = responses.map((resp) => {
      const screening = screeningMap.get(resp.id);
      const interview = interviewMap.get(resp.id);

      return {
        id: resp.id,
        candidateId: resp.candidateId,
        candidateName: resp.candidateName,
        proposedPrice: resp.proposedPrice,

        proposedDeliveryDays: resp.proposedDeliveryDays,
        coverLetter: resp.coverLetter,
        experience: resp.experience,
        skills: resp.skills,
        rating: resp.rating,
        status: resp.status,
        hrSelectionStatus: resp.hrSelectionStatus,
        compositeScore: resp.compositeScore,
        strengths: resp.strengths,
        weaknesses: resp.weaknesses,
        recommendation: resp.recommendation,
        screeningScore: screening?.score ?? null,
        screeningDetailedScore: screening?.detailedScore ?? null,
        interviewScore: interview
          ? (interview.rating ?? Math.round((interview.score ?? 0) / 20))
          : null,
        screeningAnalysis: screening?.analysis ?? null,
        interviewDetailedScore: interview?.score ?? null,
        interviewAnalysis: interview?.analysis ?? null,
      };
    });

    // Расчет статистики
    const statistics = this.calculateStatistics(candidates);

    return {
      entityType: "gig",
      entityId: gigId,
      mainContext: {
        id: gigData.id,
        workspaceId: gigData.workspaceId,
        title: gigData.title,
        description: gigData.description,
        requirements: gigData.requirements,
        type: gigData.type,
        budgetMin: gigData.budgetMin,
        budgetMax: gigData.budgetMax,

        deadline: gigData.deadline,
        estimatedDuration: gigData.estimatedDuration,
        customBotInstructions: gigData.customBotInstructions,
      },
      relatedContext: {
        candidates,
      },
      statistics,
    };
  }

  private calculateStatistics(
    candidates: CandidateData[],
  ): Record<string, unknown> {
    const total = candidates.length;

    const byStatus: Record<string, number> = {};
    for (const candidate of candidates) {
      byStatus[candidate.status] = (byStatus[candidate.status] || 0) + 1;
    }

    const byRecommendation: Record<string, number> = {};
    for (const candidate of candidates) {
      if (candidate.recommendation) {
        byRecommendation[candidate.recommendation] =
          (byRecommendation[candidate.recommendation] || 0) + 1;
      }
    }

    const pricesInRub = candidates
      .filter((c) => c.proposedPrice !== null)
      .map((c) => c.proposedPrice as number);
    const avgPrice =
      pricesInRub.length > 0
        ? Math.round(
            pricesInRub.reduce((a, b) => a + b, 0) / pricesInRub.length,
          )
        : null;

    const deliveryDays = candidates
      .filter((c) => c.proposedDeliveryDays !== null)
      .map((c) => c.proposedDeliveryDays as number);
    const avgDeliveryDays =
      deliveryDays.length > 0
        ? Math.round(
            deliveryDays.reduce((a, b) => a + b, 0) / deliveryDays.length,
          )
        : null;

    const screeningScores = candidates
      .filter((c) => c.screeningDetailedScore !== null)
      .map((c) => c.screeningDetailedScore as number);
    const avgScreeningScore =
      screeningScores.length > 0
        ? Math.round(
            screeningScores.reduce((a, b) => a + b, 0) / screeningScores.length,
          )
        : null;

    const interviewScores = candidates
      .filter((c) => c.interviewDetailedScore !== null)
      .map((c) => c.interviewDetailedScore as number);
    const avgInterviewScore =
      interviewScores.length > 0
        ? Math.round(
            interviewScores.reduce((a, b) => a + b, 0) / interviewScores.length,
          )
        : null;

    return {
      total,
      byStatus,
      byRecommendation,
      avgPrice,
      avgDeliveryDays,
      avgScreeningScore,
      avgInterviewScore,
    };
  }
}
