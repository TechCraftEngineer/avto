// Специфичные типы для vacancy откликов

import type { RouterOutputs } from "@qbs-autonaim/api";

/**
 * Vacancy отклик - inferred тип из API
 */
export type VacancyResponse = NonNullable<
  RouterOutputs["vacancy"]["responses"]["get"]
>;

/**
 * Vacancy - inferred тип из API
 */
export type Vacancy = NonNullable<RouterOutputs["vacancy"]["get"]>;

/**
 * Vacancy Response from list - inferred тип из API list
 */
export type VacancyResponseFromList = NonNullable<
  RouterOutputs["vacancy"]["responses"]["list"]
>["responses"][0];

/**
 * Маппированный тип screening из API (для обратной совместимости)
 */
export type MappedScreening = NonNullable<VacancyResponse["screening"]>;

/**
 * Пропсы для vacancy response detail card
 */
export interface VacancyResponseDetailCardProps {
  response: VacancyResponse;
  vacancy?: Vacancy;
  allResponses?: VacancyResponseFromList[];
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
  vacancy?: Vacancy;
  defaultTab: string;
  hasScreening: boolean;
  hasInterviewScoring: boolean;
  hasConversation: boolean;
  screening: MappedScreening | null;
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
