// Специфичные типы для gig откликов

import type { Response } from "@qbs-autonaim/db/schema";

/**
 * Gig отклик - содержит только gig-специфичные поля
 */
export type GigResponse = Omit<Response, 'resumeId' | 'resumeUrl' | 'platformProfileUrl' | 'salaryExpectationsAmount' | 'salaryExpectationsComment' | 'screening'> & {
  entityType: 'gig';
  // Гарантированно gig-специфичные поля
  proposedPrice: number | null;
  proposedDeliveryDays: number | null;
  portfolioLinks: string[] | null;
  portfolioFileId: string | null;

  // Gig-специфичный scoring
  compositeScore: number | null;
  priceScore: number | null;
  deliveryScore: number | null;
  skillsMatchScore: number | null;
  experienceScore: number | null;
  compositeScoreReasoning: string | null;
  priceScoreReasoning: string | null;
  deliveryScoreReasoning: string | null;
  skillsMatchScoreReasoning: string | null;
  experienceScoreReasoning: string | null;
};

/**
 * Пропсы для gig response detail card
 */
export interface GigResponseDetailCardProps {
  response: GigResponse;
  onAccept?: () => void;
  onReject?: () => void;
  onMessage?: () => void;
  onEvaluate?: () => void;
  isProcessing?: boolean;
  isPolling?: boolean;
}

/**
 * Пропсы для gig response tabs
 */
export interface GigResponseTabsProps {
  response: GigResponse;
  defaultTab: string;
  hasInterviewScoring: boolean;
  hasConversation: boolean;
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