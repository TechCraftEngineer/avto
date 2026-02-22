import type * as schema from "@qbs-autonaim/db/schema";
import { interviewMessage } from "@qbs-autonaim/db/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

type Database = NodePgDatabase<typeof schema>;

type MessagePart = {
  type: string;
  text?: string;
  [key: string]: unknown;
};

type Message = {
  id: string;
  role: string;
  content?: string;
  parts?: MessagePart[];
};

/**
 * Извлечение текста из сообщения
 */
export function extractMessageText(message: Message): string {
  return (
    message.parts
      ?.filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("\n") ||
    message.content ||
    ""
  );
}

/**
 * Проверка наличия голосового файла в сообщении
 */
export function hasVoiceFile(message: Message): boolean {
  return (
    message.parts?.some((p) => {
      if (p.type !== "file") return false;

      // Проверяем MIME-тип если есть
      const mime = (p as { mime?: string }).mime;
      if (mime?.startsWith("audio/")) return true;

      // Проверяем расширение файла
      const filename = (p as { filename?: string }).filename;
      if (filename) {
        const ext = filename.toLowerCase().split(".").pop();
        return ["mp3", "wav", "webm", "ogg", "m4a", "aac"].includes(ext || "");
      }

      return false;
    }) ?? false
  );
}

/**
 * Сохранение текстового сообщения пользователя
 */
export async function saveUserMessage(
  sessionId: string,
  messageText: string,
  hasVoice: boolean,
  db: Database,
): Promise<Date | null> {
  if (!messageText || hasVoice) {
    return null;
  }

  const [savedMessage] = await db
    .insert(interviewMessage)
    .values({
      sessionId,
      role: "user",
      type: "text",
      channel: "web",
      content: messageText,
    })
    .returning({ createdAt: interviewMessage.createdAt });

  return savedMessage?.createdAt ?? null;
}

/**
 * Сохранение сообщений ассистента
 */
export async function saveAssistantMessages(
  sessionId: string,
  messages: Array<{ id: string; role: string; parts?: MessagePart[] }>,
  db: Database,
) {
  const assistantMessages = messages.filter((m) => m.role === "assistant");

  for (const msg of assistantMessages) {
    const textParts = msg.parts?.filter(
      (p): p is { type: "text"; text: string } =>
        p.type === "text" && "text" in p,
    );

    const content = textParts?.map((p) => p.text).join("\n") || "";

    if (content) {
      await db.insert(interviewMessage).values({
        sessionId,
        role: "assistant",
        type: "text",
        channel: "web",
        content,
      });
    }
  }
}
