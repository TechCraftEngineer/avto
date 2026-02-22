import {
  getInterviewSessionMetadata,
  updateInterviewSessionMetadata,
} from "@qbs-autonaim/server-utils";
import { tool } from "ai";
import { z } from "zod";

export function createSaveInterviewNoteTool(sessionId: string) {
  return tool({
    description:
      "Сохраняет внутреннюю заметку/сигнал по интервью в метаданные interview session. Это НЕ отправляется кандидату.",
    inputSchema: z.object({
      type: z.enum(["note", "signal"]),
      content: z.string().min(1).max(2000),
      tag: z.string().max(50).optional(),
    }),
    execute: async (args: Record<string, unknown>) => {
      const { type, content, tag } = args as {
        type: "note" | "signal";
        content: string;
        tag?: string;
      };
      const metadata = await getInterviewSessionMetadata(sessionId);
      const existing = metadata.interviewNotes ?? [];

      const next = [
        ...existing,
        {
          type,
          content,
          tag,
          timestamp: new Date().toISOString(),
        },
      ];

      const success = await updateInterviewSessionMetadata(sessionId, {
        interviewNotes: next,
      });

      return {
        success,
        count: next.length,
      };
    },
  });
}

export function createSaveQuestionAnswerTool(sessionId: string) {
  return tool({
    description:
      "Сохраняет пару вопрос-ответ в метаданные interview session. Если question не указан, используется lastQuestionAsked.",
    inputSchema: z.object({
      answer: z.string().min(1).max(8000),
      question: z.string().min(1).max(2000).optional(),
    }),
    execute: async (args: Record<string, unknown>) => {
      const { answer, question } = args as {
        answer: string;
        question?: string;
      };

      const metadata = await getInterviewSessionMetadata(sessionId);
      const actualQuestion = question ?? metadata.lastQuestionAsked;

      if (!actualQuestion) {
        return { success: false, reason: "No question to attach answer" };
      }

      const existing = metadata.questionAnswers ?? [];
      const next = [
        ...existing,
        {
          question: actualQuestion,
          answer,
          timestamp: new Date().toISOString(),
        },
      ];

      const success = await updateInterviewSessionMetadata(sessionId, {
        questionAnswers: next,
      });

      return { success, count: next.length };
    },
  });
}
