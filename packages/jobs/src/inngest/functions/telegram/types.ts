import type { BotSettings } from "@qbs-autonaim/shared";

export type { BotSettings };

export interface MessagePayload {
  workspaceId: string;
  messageData: {
    id: number;
    chatId: string;
    text?: string;
    isOutgoing: boolean;
    media?: {
      type: string;
      fileId?: string;
      mimeType?: string;
      duration?: number;
      [key: string]: unknown;
    };
    sender?: {
      type: string;
      username?: string;
      firstName?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}

export type PromptStage = "PIN_RECEIVED" | "INVALID_PIN" | "AWAITING_PIN";

export interface ChatSessionMetadata {
  interviewStarted?: boolean;
  interviewCompleted?: boolean;
  identifiedBy?: string;
  awaitingPin?: boolean;
  lastQuestionAsked?: string;
  questionAnswers?: Array<{ question: string; answer: string }>;
}

/** @deprecated Use ChatSessionMetadata instead */
export type ConversationMetadata = ChatSessionMetadata;
