type DBMessage = {
  role: string;
  content: string | null;
  type: string;
  voiceTranscription?: string | null;
  createdAt: Date;
};

type ConversationMessage = {
  sender: "CANDIDATE" | "BOT";
  content: string;
  timestamp: Date;
};

/**
 * Формирование истории диалога для оркестратора
 */
export function buildConversationHistory(
  messages: DBMessage[],
  currentMessage?: string,
  currentTimestamp?: Date | null,
): ConversationMessage[] {
  const history = messages
    .filter((msg) => msg.role === "user" || msg.role === "assistant")
    .map((msg) => ({
      sender: (msg.role === "user" ? "CANDIDATE" : "BOT") as
        | "CANDIDATE"
        | "BOT",
      content: msg.content ?? "",
      timestamp: msg.createdAt,
    }));

  if (currentMessage) {
    history.push({
      sender: "CANDIDATE",
      content: currentMessage,
      timestamp: currentTimestamp ?? new Date(),
    });
  }

  return history;
}

/**
 * Формирование сообщений для AI модели
 */
export function formatMessagesForModel(
  messages: DBMessage[],
  currentMessage?: string,
): Array<{ role: "user" | "assistant"; content: string }> {
  const formatted = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => {
      const baseText =
        m.type === "voice"
          ? (m.voiceTranscription ?? m.content ?? "")
          : (m.content ?? "");

      const content =
        m.type === "voice" ? `[Голосовое сообщение]\n${baseText}` : baseText;

      return {
        role: m.role as "user" | "assistant",
        content,
      };
    });

  if (currentMessage) {
    const last = formatted.at(-1);
    if (last?.role !== "user" || last.content !== currentMessage) {
      formatted.push({ role: "user", content: currentMessage });
    }
  }

  return formatted;
}
