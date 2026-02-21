// Специфичные типы для gig откликов

import type { RouterOutputs } from "@qbs-autonaim/api";
import type { GigContextData } from "@qbs-autonaim/shared";

/** Реэкспорт для GigResponseDetailCard, header-card, pricing-card, summary-card */
export type { GigContextData };

/**
 * Gig отклик - inferred тип из API
 */
export type GigResponse = NonNullable<RouterOutputs["gig"]["responses"]["get"]>;

/**
 * Пропсы для gig response detail card
 */
export interface GigResponseDetailCardProps {
  response: GigResponse;
  gig?: GigContextData;
  onAccept?: () => void;
  onStartKworkChat?: () => void;
  onReject?: () => void;
  onMessage?: () => void;
  onSendGreeting?: () => void;
  onEvaluate?: () => void;
  isProcessing?: boolean;
  isPolling?: boolean;
  isSendingGreeting?: boolean;
  isStartingKworkChat?: boolean;
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
