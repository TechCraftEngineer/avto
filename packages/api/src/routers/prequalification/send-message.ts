/**
 * Send Message Procedure
 *
 * ���������� ��������� �� ��������� � ������ ���������������.
 * ��������� ��������� - �� ������� ����������� ������������.
 */

import { ORPCError } from "@orpc/server";
import { generateText } from "@qbs-autonaim/lib/ai";
import { z } from "zod";
import { publicProcedure } from "../../orpc";
import {
  DialogueHandler,
  SessionManager,
} from "../../services/prequalification";
import { PrequalificationError } from "../../services/prequalification/types";

const sendMessageInputSchema = z.object({
  sessionId: z.string().uuid("sessionId ������ ���� UUID"),
  workspaceId: z.string().min(1, "workspaceId ����������"),
  message: z
    .string()
    .min(1, "message ����������")
    .max(5000, "��������� ������� �������"),
});

export const sendMessage = publicProcedure
  .input(sendMessageInputSchema)
  .handler(async ({ context, input }) => {
    const sessionManager = new SessionManager(context.db);
    const dialogueHandler = new DialogueHandler(context.db);

    // Verify session exists and is in dialogue_active status
    const session = await sessionManager.getSession(
      input.sessionId,
      input.workspaceId,
    );

    if (!session) {
      throw new ORPCError("NOT_FOUND", { message: "������ �� �������" });
    }

    if (session.status !== "dialogue_active") {
      throw new ORPCError("BAD_REQUEST", {
        message: `Отправка сообщений недоступна в статусе: ${session.status}`,
      });
    }

    try {
      // Get workspace config
      const config = await sessionManager.getWorkspaceConfig(input.workspaceId);

      // Get or create interviewSession
      let interviewSessionId = session.interviewSessionId;
      if (!interviewSessionId) {
        const candidateName =
          session.parsedResume?.structured?.personalInfo?.name;
        interviewSessionId = await dialogueHandler.createInterviewSession(
          input.sessionId,
          input.workspaceId,
          candidateName ?? undefined,
        );
      }

      // Get dialogue context
      const dialogueContext = await dialogueHandler.getDialogueContext(
        input.sessionId,
        input.workspaceId,
        config,
      );

      // Save user message
      await dialogueHandler.saveMessage(
        interviewSessionId,
        input.message,
        "user",
      );

      // Check if this is the first message (need welcome message first)
      const isFirstExchange = dialogueContext.conversationHistory.length === 0;

      // Build AI prompt
      const prompt = buildDialoguePrompt(
        dialogueContext,
        input.message,
        config,
        isFirstExchange,
      );

      // Generate AI response
      const { text: aiResponse } = await generateText({
        prompt,
        generationName: "prequalification-dialogue",
        metadata: {
          sessionId: input.sessionId,
          vacancyId: dialogueContext.vacancyId,
        },
      });

      // Save AI response
      await dialogueHandler.saveMessage(
        interviewSessionId,
        aiResponse,
        "assistant",
      );

      // Update conversation history for checks
      const updatedHistory = [
        ...dialogueContext.conversationHistory,
        {
          role: "user" as const,
          content: input.message,
          timestamp: new Date(),
        },
        {
          role: "assistant" as const,
          content: aiResponse,
          timestamp: new Date(),
        },
      ];

      // Check mandatory questions
      const mandatoryCheck = dialogueHandler.checkMandatoryQuestions(
        updatedHistory,
        config.mandatoryQuestions,
      );

      // Check if dialogue is sufficient for evaluation
      const isSufficient = dialogueHandler.isDialogueSufficient(
        updatedHistory,
        config,
      );
      const dialogueComplete = isSufficient && mandatoryCheck.allAsked;

      // If dialogue is complete, transition to evaluating
      let newStatus: "dialogue_active" | "evaluating" =
        session.status as "dialogue_active";
      if (dialogueComplete) {
        await sessionManager.updateSessionStatus(
          input.sessionId,
          input.workspaceId,
          "evaluating",
        );
        newStatus = "evaluating";
      }

      return {
        response: {
          message: aiResponse,
          isComplete: dialogueComplete,
          nextQuestion: dialogueComplete
            ? undefined
            : extractNextQuestion(aiResponse),
        },
        status: newStatus,
        dialogueComplete,
        mandatoryQuestionsAsked: mandatoryCheck.askedQuestions,
        mandatoryQuestionsMissing: mandatoryCheck.missingQuestions,
      };
    } catch (error) {
      if (error instanceof PrequalificationError) {
        const codeMap: Record<
          string,
          "BAD_REQUEST" | "NOT_FOUND" | "FORBIDDEN" | "INTERNAL_SERVER_ERROR"
        > = {
          SESSION_NOT_FOUND: "NOT_FOUND",
          INVALID_STATE_TRANSITION: "BAD_REQUEST",
          TENANT_MISMATCH: "FORBIDDEN",
          INTERVIEW_SESSION_CREATION_FAILED: "INTERNAL_SERVER_ERROR",
        };

        throw new ORPCError(codeMap[error.code] ?? "INTERNAL_SERVER_ERROR", {
          message: error.userMessage,
          cause: error,
        });
      }

      throw error;
    }
  });

/**
 * Builds the AI prompt for dialogue
 */
function buildDialoguePrompt(
  context: Awaited<ReturnType<DialogueHandler["getDialogueContext"]>>,
  userMessage: string,
  config: Awaited<ReturnType<SessionManager["getWorkspaceConfig"]>>,
  isFirstExchange: boolean,
): string {
  const toneInstruction =
    config.tone === "formal"
      ? "��������� ����������, ������� ����� �������. ��������� �� '��'."
      : "��������� �����������, �� ���������������� �����. ����� ���������� �� '��'.";

  const resumeInfo = context.parsedResume?.structured
    ? `
������ ���������:
���: ${context.parsedResume.structured.personalInfo?.name ?? "�� �������"}
����: ${context.parsedResume.structured.experience?.map((e) => `${e.position} � ${e.company}`).join(", ") ?? "�� ������"}
������: ${context.parsedResume.structured.skills?.join(", ") ?? "�� �������"}
`
    : "";

  const historyText = context.conversationHistory
    .map(
      (msg) =>
        `${msg.role === "assistant" ? "AI" : "��������"}: ${msg.content}`,
    )
    .join("\n\n");

  const mandatoryQuestionsText =
    config.mandatoryQuestions.length > 0
      ? `\n������������ ������� (����� �� � ���� �������):\n${config.mandatoryQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
      : "";

  return `�� � AI-��������� �� ������� ���������, ���������� ��������������� ���������.

${toneInstruction}

��������:
��������: ${context.vacancyTitle}
��������: ${context.vacancyDescription ?? "�� �������"}
${context.vacancyRequirements ? `����������: ${JSON.stringify(context.vacancyRequirements)}` : ""}

${resumeInfo}
${mandatoryQuestionsText}

${historyText ? `������� �������:\n${historyText}\n` : ""}

������� ��������� ���������:
${userMessage}

������:
${
  isFirstExchange
    ? "��� ������ �������. ������������� ���������, ����������� �� ������� � �������� � ����� ������ ������ ��� ������ ������������."
    : "�������� ������. ���������� �� ����� ��������� � ����� ��������� ����������� ������ ��� ������ ������������ ��������."
}

�������� ��������� � �������: ${config.maxDialogueTurns}. ������� ���������� �������: ${Math.floor(context.conversationHistory.length / 2) + 1}.

���������� � ������:
1. ������� ������ � �� ���� (2-4 �����������)
2. ������� ���� ���������� ������ �� ���
3. �� �������� ��� �������� �������
4. ����������� �� ������ ������������ ����������� ��������

����� (������ ����� ������, ��� �������������� ������������):`;
}

/**
 * Extracts the next question from AI response
 */
function extractNextQuestion(response: string): string | undefined {
  // Try to find a question in the response
  const questionMatch = response.match(/[^.!]*\?/);
  return questionMatch ? questionMatch[0].trim() : undefined;
}
