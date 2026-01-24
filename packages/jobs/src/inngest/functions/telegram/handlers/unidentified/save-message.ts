import { db } from "@qbs-autonaim/db/client";
import { interviewMessage } from "@qbs-autonaim/db/schema";
import { tempMessageBufferService } from "@qbs-autonaim/jobs/services/buffer";
import { removeNullBytes } from "@qbs-autonaim/lib";
import { findDuplicateMessage } from "../../utils";

export async function saveUnidentifiedMessage(params: {
  chatSessionId: string;
  content: string;
  messageId: string;
  contentType?: "text" | "voice";
}) {
  const { chatSessionId, content, messageId, contentType = "text" } = params;

  if (chatSessionId.startsWith("temp_")) {
    const chatId = chatSessionId.replace("temp_", "");

    try {
      await tempMessageBufferService.addMessage({
        tempConversationId: chatSessionId,
        chatId,
        message: {
          id: messageId,
          content,
          contentType: contentType.toUpperCase() as "TEXT" | "VOICE",
          sender: "CANDIDATE",
          timestamp: new Date(),
          externalMessageId: messageId,
        },
      });
    } catch (error) {
      console.error("Failed to save temporary message:", {
        chatSessionId,
        chatId,
        messageId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return;
  }

  try {
    const isDuplicate = await findDuplicateMessage(chatSessionId, messageId);

    if (!isDuplicate) {
      await db.insert(interviewMessage).values({
        sessionId: chatSessionId,
        role: "user",
        type: contentType,
        content: removeNullBytes(content),
        externalId: messageId,
        channel: "telegram",
      });
    }
  } catch (error) {
    console.error("Failed to save unidentified message:", {
      chatSessionId,
      messageId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
