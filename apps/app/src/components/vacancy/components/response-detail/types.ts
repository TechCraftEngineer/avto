// Специфичные типы для vacancy откликов

import type {
  VacancyDetail,
  VacancyResponseDetail,
  VacancyResponseListItem,
} from "~/types/api";

/**
 * Re-export централизованных типов для обратной совместимости
 */
export type VacancyResponse = VacancyResponseDetail;
export type Vacancy = VacancyDetail;
export type VacancyResponseFromList = VacancyResponseListItem;

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
