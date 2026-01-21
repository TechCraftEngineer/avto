/**
 * Оркестратор для WEB интервью со стримингом
 */

import type { LanguageModel } from "ai";
import { generateText } from "@qbs-autonaim/lib/ai";
import type { Langfuse } from "langfuse";
import { z } from "zod";
import { extractJsonObject } from "../../utils/json-extractor";
import {
  buildContextAnalyzerPrompt,
  buildGigInterviewPrompt,
  buildVacancyInterviewPrompt,
} from "./prompts";
import type {
  ContextAnalysisResult,
  GigData,
  InterviewVacancyData,
  WebInterviewContext,
} from "./types";

export type {
  ContextAnalysisResult,
  GigData,
  InterviewVacancyData,
  WebInterviewContext,
} from "./types";

export interface WebInterviewOrchestratorConfig {
  model: LanguageModel;
  langfuse?: Langfuse;
}

const contextAnalysisSchema = z.object({
  messageType: z.enum([
    "ANSWER",
    "QUESTION",
    "ACKNOWLEDGMENT",
    "OFF_TOPIC",
    "CONTINUATION",
  ]),
  requiresResponse: z.boolean(),
  shouldEscalate: z.boolean(),
  escalationReason: z.string().nullable(),
});

export class WebInterviewOrchestrator {
  private model: LanguageModel;
  private langfuse?: Langfuse;
  private traceId?: string;

  constructor(config: WebInterviewOrchestratorConfig) {
    this.model = config.model;
    this.langfuse = config.langfuse;
  }

  setTraceId(traceId: string) {
    this.traceId = traceId;
  }

  async analyzeContext(
    message: string,
    history: Array<{ sender: "CANDIDATE" | "BOT"; content: string }>,
  ): Promise<ContextAnalysisResult> {
    const prompt = buildContextAnalyzerPrompt(message, history);

    const span = this.langfuse?.span({
      traceId: this.traceId,
      name: "context-analysis",
      input: { message, historyLength: history.length, prompt },
    });

    try {
      const result = await generateText({
        model: this.model,
        prompt,
        generationName: "web-interview-context-analysis",
        entityId: this.traceId,
      });

      const jsonObject = extractJsonObject(result.text);
      if (jsonObject) {
        const parsed = contextAnalysisSchema.safeParse(jsonObject);
        if (parsed.success) {
          const output = {
            ...parsed.data,
            escalationReason: parsed.data.escalationReason ?? undefined,
          };

          span?.end({
            output,
            metadata: { success: true, rawResponse: result.text },
          });

          return output;
        }
      }

      span?.end({
        output: { error: "Failed to parse response" },
        metadata: { success: false, rawResponse: result.text },
      });
    } catch (error) {
      console.error(
        "[WebInterviewOrchestrator] Context analysis failed:",
        error,
      );

      span?.end({
        output: { error: error instanceof Error ? error.message : "Unknown" },
        metadata: { success: false },
      });
    }

    return {
      messageType: "ANSWER",
      requiresResponse: true,
      shouldEscalate: false,
    };
  }

  buildVacancyPrompt(
    vacancy: InterviewVacancyData,
    context: WebInterviewContext,
    isFirstResponse: boolean,
  ): string {
    return buildVacancyInterviewPrompt(vacancy, context, isFirstResponse);
  }

  buildGigPrompt(
    gig: GigData,
    context: WebInterviewContext,
    isFirstResponse: boolean,
  ): string {
    return buildGigInterviewPrompt(gig, context, isFirstResponse);
  }
}
