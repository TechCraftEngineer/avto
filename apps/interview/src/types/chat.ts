export interface MessagePart {
  type: "text" | "file";
  text?: string;
  url?: string;
  mediaType?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  parts: MessagePart[];
  createdAt?: Date;
}

export type { ChatStatus } from "@qbs-autonaim/shared";
