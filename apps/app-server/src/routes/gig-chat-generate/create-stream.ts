import {
  sanitizeConversationMessage,
  sanitizePromptText,
  truncateText,
} from "@qbs-autonaim/lib";
import { streamText } from "@qbs-autonaim/lib/ai";
import { buildGigPrompt } from "./build-prompt";
import { parseGigAIResponse } from "./parse-ai-response";
import type { GigAIResponse, GigDocument } from "./types";

export interface CreateGigStreamParams {
  message: string;
  currentDocument?: GigDocument;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  companySettings?: {
    companyName?: string;
    companyDescription?: string;
    botName?: string;
    botRole?: string;
  } | null;
}

export function createGigStream(params: CreateGigStreamParams): ReadableStream {
  const { message, currentDocument, conversationHistory, companySettings } =
    params;

  const sanitizedMessage = truncateText(sanitizePromptText(message), 5000);
  const sanitizedHistory = conversationHistory
    ? conversationHistory
        .slice(0, 10)
        .map((msg) => sanitizeConversationMessage(msg))
    : undefined;

  const prompt = buildGigPrompt(
    sanitizedMessage,
    currentDocument,
    sanitizedHistory,
    companySettings,
  );

  let result: ReturnType<typeof streamText>;
  try {
    result = streamText({ prompt });
  } catch (aiError) {
    console.error("[gig-chat-generate] AI error:", aiError);
    throw new Error("Не удалось сгенерировать задание. Попробуйте позже.");
  }

  const encoder = new TextEncoder();
  let fullText = "";
  let lastSentResponse: GigAIResponse | null = null;
  let chunkCounter = 0;

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.textStream) {
          fullText += chunk;
          chunkCounter++;

          if (chunkCounter % 3 === 0) {
            const { response: partialResponse } = parseGigAIResponse(
              fullText,
              currentDocument,
            );

            const responseString = JSON.stringify(partialResponse);
            const lastResponseString = JSON.stringify(lastSentResponse);

            if (responseString !== lastResponseString) {
              lastSentResponse = partialResponse;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    document: partialResponse.document,
                    message: partialResponse.message,
                    partial: true,
                  })}\n\n`,
                ),
              );
            }
          }
        }

        const { response: finalResponse } = parseGigAIResponse(
          fullText,
          currentDocument,
        );

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              document: finalResponse.document,
              message: finalResponse.message,
              quickReplies: finalResponse.quickReplies ?? [],
              done: true,
            })}\n\n`,
          ),
        );

        controller.close();
      } catch (streamError) {
        console.error("[gig-chat-generate] Stream error:", streamError);

        const { response: recoveredResponse } = parseGigAIResponse(
          fullText,
          currentDocument,
        );

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              document: recoveredResponse.document,
              message: recoveredResponse.message,
              quickReplies: recoveredResponse.quickReplies ?? [],
              error:
                streamError instanceof Error
                  ? streamError.message
                  : "Ошибка генерации",
              done: true,
            })}\n\n`,
          ),
        );
        controller.close();
      }
    },
  });
}
