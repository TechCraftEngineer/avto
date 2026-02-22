import { ORPCError } from "@orpc/server";
import type { InterviewSessionMetadata } from "@qbs-autonaim/db/schema";
import { messageBufferService } from "@qbs-autonaim/jobs/services/buffer";
import { z } from "zod";
import { publicProcedure } from "../../../orpc";

const getWebInterviewStatusInputSchema = z.object({
  interviewSessionId: z.string().uuid(),
});

export const getWebInterviewStatus = publicProcedure
  .input(getWebInterviewStatusInputSchema)
  .handler(async ({ input, context }) => {
    // Проверяем существование interview session
    const session = await context.db.query.interviewSession.findFirst({
      where: (interviewSession, { eq }) =>
        eq(interviewSession.id, input.interviewSessionId),
    });

    if (!session) {
      throw new ORPCError("NOT_FOUND", { message: "Интервью не найдено" });
    }

    // Получаем текущий номер вопроса из метаданных
    const metadata = (session.metadata as InterviewSessionMetadata) || {};
    const questionAnswers = metadata.questionAnswers || [];
    const interviewStep = questionAnswers.length + 1;

    // Проверяем наличие активного буфера
    const hasActiveBuffer = await messageBufferService.hasBuffer({
      userId: metadata.telegramUsername || "web_user",
      chatSessionId: input.interviewSessionId,
      interviewStep,
    });

    return {
      interviewSessionId: session.id,
      status: session.status,
      hasActiveBuffer,
      interviewStep,
      questionCount: questionAnswers.length,
    };
  });
