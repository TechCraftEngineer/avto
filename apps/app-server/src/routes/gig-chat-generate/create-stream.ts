import {
  sanitizeConversationMessage,
  sanitizePromptText,
  truncateText,
} from "@qbs-autonaim/lib";
import { streamText } from "@qbs-autonaim/lib/ai";
import { buildGigPrompt } from "./build-prompt";
import { parseGigAIResponse } from "./parse-ai-response";
import type { GigAIResponse, GigDocument } from "./types";

function filterAIContent(value: string | null | undefined): string {
  if (value == null || typeof value !== "string") return "";
  return truncateText(sanitizePromptText(value), 5000);
}

function sanitizeGigDocument(doc: GigDocument | undefined): GigDocument {
  if (!doc) return {};
  return {
    title: doc.title ? filterAIContent(doc.title) : undefined,
    description: doc.description ? filterAIContent(doc.description) : undefined,
    deliverables: doc.deliverables
      ? filterAIContent(doc.deliverables)
      : undefined,
    requiredSkills: doc.requiredSkills
      ? filterAIContent(doc.requiredSkills)
      : undefined,
    budgetRange: doc.budgetRange ? filterAIContent(doc.budgetRange) : undefined,
    timeline: doc.timeline ? filterAIContent(doc.timeline) : undefined,
  };
}

function sanitizeCompanySettings(
  cs:
    | {
        companyName?: string;
        companyDescription?: string;
        botName?: string;
        botRole?: string;
      }
    | null
    | undefined,
): typeof cs {
  if (!cs) return cs;
  return {
    companyName: cs.companyName ? filterAIContent(cs.companyName) : undefined,
    companyDescription: cs.companyDescription
      ? filterAIContent(cs.companyDescription)
      : undefined,
    botName: cs.botName ? filterAIContent(cs.botName) : undefined,
    botRole: cs.botRole ? filterAIContent(cs.botRole) : undefined,
  };
}

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
  const sanitizedCurrentDocument = currentDocument
    ? sanitizeGigDocument(currentDocument)
    : undefined;
  const sanitizedCompanySettings = sanitizeCompanySettings(companySettings);

  const prompt = buildGigPrompt(
    sanitizedMessage,
    sanitizedCurrentDocument,
    sanitizedHistory,
    sanitizedCompanySettings,
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
              const sanitizedDoc = sanitizeGigDocument(
                partialResponse.document,
              );
              const sanitizedMsg = filterAIContent(partialResponse.message);
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    document: sanitizedDoc,
                    message: sanitizedMsg,
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
        const sanitizedDoc = sanitizeGigDocument(finalResponse.document);
        const sanitizedMsg = filterAIContent(finalResponse.message);
        const sanitizedReplies = (finalResponse.quickReplies ?? []).map((r) =>
          filterAIContent(r),
        );
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              document: sanitizedDoc,
              message: sanitizedMsg,
              quickReplies: sanitizedReplies,
              done: true,
            })}\n\n`,
          ),
        );

        controller.close();
      } catch (streamError) {
        if (streamError instanceof Error) {
          console.error(
            "[gig-chat-generate] Stream error:",
            streamError,
            streamError.stack,
          );
        } else {
          console.error("[gig-chat-generate] Stream error:", streamError);
        }

        const { response: recoveredResponse } = parseGigAIResponse(
          fullText,
          currentDocument,
        );
        const sanitizedDoc = sanitizeGigDocument(recoveredResponse.document);
        const sanitizedMsg = filterAIContent(recoveredResponse.message);
        const sanitizedReplies = (recoveredResponse.quickReplies ?? []).map(
          (r) => filterAIContent(r),
        );
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              document: sanitizedDoc,
              message: sanitizedMsg,
              quickReplies: sanitizedReplies,
              error: "Ошибка генерации",
              done: true,
            })}\n\n`,
          ),
        );
        controller.close();
      }
    },
  });
}
