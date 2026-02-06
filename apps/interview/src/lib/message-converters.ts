import type { UIMessage } from "ai";
import type { ChatMessage, MessagePart } from "~/types/chat";

export function convertHistoryMessage(message: {
  id: string;
  role: "user" | "assistant" | "system";
  content: string | null;
  type: "text" | "voice" | "file" | "event";
  createdAt: Date;
  voiceTranscription: string | null;
  fileUrl: string | null;
}): ChatMessage {
  const role = message.role;
  const parts: MessagePart[] = [];

  if (message.type === "voice") {
    if (message.fileUrl) {
      parts.push({
        type: "file",
        url: message.fileUrl,
        mediaType: "audio/webm",
      });
    }
    if (message.voiceTranscription) {
      parts.push({ type: "text", text: message.voiceTranscription });
    }
  } else {
    parts.push({ type: "text", text: message.content ?? "" });
  }

  return { id: message.id, role, parts, createdAt: message.createdAt };
}

export function convertUIMessage(msg: {
  id: string;
  role: string;
  parts?: Array<{
    type: string;
    text?: string;
    url?: string;
    mediaType?: string;
  }>;
  content?: string;
}): ChatMessage {
  const parts: MessagePart[] = [];

  if (msg.parts) {
    for (const part of msg.parts) {
      if (part.type === "text" && part.text) {
        parts.push({ type: "text", text: part.text });
      } else if (part.type === "file" && part.url) {
        parts.push({
          type: "file",
          url: part.url,
          mediaType: part.mediaType,
        });
      }
    }
  } else if (msg.content) {
    parts.push({ type: "text", text: msg.content });
  }

  return {
    id: msg.id,
    role: msg.role as "user" | "assistant" | "system",
    parts,
  };
}

export function convertToSDKMessage(msg: ChatMessage): UIMessage {
  const sdkParts = msg.parts
    .map((part) => {
      if (part.type === "text" && part.text) {
        return { type: "text" as const, text: part.text };
      } else if (part.type === "file" && part.url) {
        return {
          type: "file" as const,
          url: part.url,
          mediaType: part.mediaType || "audio/webm",
        };
      }
      return null;
    })
    .filter(Boolean);

  return {
    id: msg.id,
    role: msg.role as "user" | "assistant",
    content: msg.parts.find((p) => p.type === "text")?.text || "",
    parts: sdkParts,
  } as UIMessage;
}
