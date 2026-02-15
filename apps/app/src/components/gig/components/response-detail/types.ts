// Специфичные типы для gig откликов

import type { RouterOutputs } from "@qbs-autonaim/api";

/**
 * Gig отклик - inferred тип из API
 */
export type GigResponse = NonNullable<RouterOutputs["gig"]["responses"]["get"]>;

/**
 * Данные о gig для контекста
 */
export interface GigContextData {
  id: string;
  title: string;
  description: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  deadline: Date | null;
  estimatedDuration: string | null;
  requiredSkills: string[];
}

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
