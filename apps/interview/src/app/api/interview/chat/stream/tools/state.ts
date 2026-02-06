import {
  getInterviewSessionMetadata,
  updateInterviewSessionMetadata,
} from "@qbs-autonaim/server-utils";
import { tool } from "ai";
import { z } from "zod";
import type { StageId } from "../stages/types";
import { VALID_STAGES } from "../stages/types";

const interviewStateSchema = z.object({
  version: z.string().optional(),
  stage: z
    .enum([
      "intro",
      "org",
      "tech",
      "wrapup",
      "profile_review",
      "task_approach",
      "motivation",
    ])
    .optional(),
  askedQuestions: z.array(z.string()).optional(),
  voiceOptionOffered: z.boolean().optional(),
  updatedAt: z.string().optional(),
});

export function createGetInterviewStateTool(sessionId: string) {
  return tool({
    description:
      "Возвращает текущее состояние интервью (stage, askedQuestions, voiceOptionOffered) из метаданных interview session.",
    inputSchema: z.object({}),
    execute: async () => {
      const metadata = await getInterviewSessionMetadata(sessionId);

      const parsed = interviewStateSchema.safeParse(
        metadata.interviewState ?? {},
      );
      const state = parsed.success ? parsed.data : {};

      let stage: StageId = state.stage ?? "intro";
      if (metadata.interviewCompleted) stage = "wrapup";

      return {
        version: state.version ?? "v1",
        stage,
        askedQuestions: state.askedQuestions ?? [],
        voiceOptionOffered: state.voiceOptionOffered ?? false,
        updatedAt: state.updatedAt ?? null,
        lastQuestionAsked: metadata.lastQuestionAsked ?? null,
        questionCount: metadata.questionAnswers?.length ?? 0,
      };
    },
  });
}

export function createUpdateInterviewStateTool(sessionId: string) {
  return tool({
    description:
      "Обновляет состояние интервью в метаданных interview session (stage, askedQuestions, voiceOptionOffered, lastQuestionAsked).",
    inputSchema: z.object({
      stage: z
        .enum([
          "intro",
          "org",
          "tech",
          "wrapup",
          "profile_review",
          "task_approach",
          "motivation",
        ])
        .optional(),
      askedQuestions: z.array(z.string()).optional(),
      voiceOptionOffered: z.boolean().optional(),
      lastQuestionAsked: z.string().min(1).max(2000).optional(),
    }),
    execute: async (args: Record<string, unknown>) => {
      const { stage, askedQuestions, voiceOptionOffered, lastQuestionAsked } =
        args as {
          stage?: StageId;
          askedQuestions?: string[];
          voiceOptionOffered?: boolean;
          lastQuestionAsked?: string;
        };

      const metadata = await getInterviewSessionMetadata(sessionId);
      const parsedPrev = interviewStateSchema.safeParse(
        metadata.interviewState ?? {},
      );
      const prev = parsedPrev.success ? parsedPrev.data : {};

      // Нормализуем stage к валидному значению или используем предыдущее
      const normalizeStage = (s: StageId | undefined): StageId | undefined => {
        if (!s) return undefined;
        return VALID_STAGES.includes(s) ? s : undefined;
      };

      const normalizedStage = normalizeStage(stage ?? prev.stage);

      const nextState: {
        version: string;
        stage: StageId | undefined;
        askedQuestions: string[];
        voiceOptionOffered: boolean | undefined;
        updatedAt: string;
      } = {
        version: prev.version ?? "v1",
        stage: normalizedStage,
        askedQuestions: askedQuestions ?? prev.askedQuestions ?? [],
        voiceOptionOffered: voiceOptionOffered ?? prev.voiceOptionOffered,
        updatedAt: new Date().toISOString(),
      };

      const success = await updateInterviewSessionMetadata(sessionId, {
        interviewState: nextState,
        lastQuestionAsked: lastQuestionAsked ?? metadata.lastQuestionAsked,
        interviewStarted: true,
      });

      return {
        success,
        state: nextState,
        lastQuestionAsked:
          lastQuestionAsked ?? metadata.lastQuestionAsked ?? null,
      };
    },
  });
}
