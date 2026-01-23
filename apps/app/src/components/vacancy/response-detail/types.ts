// Специфичные типы для vacancy откликов

import type { Response } from "@qbs-autonaim/db/schema";

/**
 * Vacancy отклик - содержит только vacancy-специфичные поля
 */
export type VacancyResponse = Omit<Response, 'proposedPrice' | 'proposedDeliveryDays' | 'portfolioLinks' | 'portfolioFileId' | 'compositeScore' | 'priceScore' | 'deliveryScore' | 'skillsMatchScore' | 'experienceScore' | 'compositeScoreReasoning' | 'priceScoreReasoning' | 'deliveryScoreReasoning' | 'skillsMatchScoreReasoning' | 'experienceScoreReasoning'> & {
  entityType: 'vacancy';
  // Гарантированно vacancy-специфичные поля
  resumeId: string | null;
  resumeUrl: string | null;
  platformProfileUrl: string | null;
  salaryExpectationsAmount: number | null;
  salaryExpectationsComment: string | null;

  // Screening специфично для vacancy
  screening: {
    score: number;
    detailedScore: number;
    analysis: string | null;
    priceAnalysis?: string | null;
    deliveryAnalysis?: string | null;
  } | null;
};

/**
 * Пропсы для vacancy response detail card
 */
export interface VacancyResponseDetailCardProps {
  response: VacancyResponse;
  onAccept?: () => void;
  onReject?: () => void;
  onMessage?: () => void;
  onEvaluate?: () => void;
  isProcessing?: boolean;
  isPolling?: boolean;
}

/**
 * Пропсы для vacancy response tabs
 */
export interface VacancyResponseTabsProps {
  response: VacancyResponse;
  defaultTab: string;
  hasScreening: boolean;
  hasInterviewScoring: boolean;
  hasConversation: boolean;
  screening: {
    score: number;
    detailedScore: number;
    analysis: string | null;
    priceAnalysis?: string | null;
    deliveryAnalysis?: string | null;
  } | null;
  conversation: {
    id: string;
    status: string;
    messages: Array<{
      id: string;
      role: "user" | "assistant" | "system";
      content: string | null;
      type: "text" | "voice" | "file" | "event";
      voiceTranscription: string | null;
      createdAt: Date;
    }>;
  } | null;
}