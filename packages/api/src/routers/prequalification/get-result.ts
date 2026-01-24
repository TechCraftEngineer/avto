/**
 * Get Result Procedure
 *
 * Получает результат преквалификации для кандидата.
 * Если сессия в статусе evaluating, запускает оценку.
 * Публичная процедура - не требует авторизации пользователя.
 */

import { and, eq } from "@qbs-autonaim/db";
import { prequalificationSession, vacancy } from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { evaluatorService } from "../../services/evaluation/evaluator";
import { feedbackGeneratorService } from "../../services/evaluation/feedback-generator";
import type { EvaluationResult } from "../../services/evaluation/types";
import {
  DialogueHandler,
  SessionManager,
} from "../../services/prequalification";
import { PrequalificationError } from "../../services/prequalification/types";
import { publicProcedure } from "../../trpc";

const getResultInputSchema = z.object({
  sessionId: z.uuid("sessionId должен быть UUID"),
  workspaceId: z.string().min(1, "workspaceId обязателен"),
});

export const getResult = publicProcedure
  .input(getResultInputSchema)
  .query(async ({ ctx, input }) => {
    const sessionManager = new SessionManager(ctx.db);
    const dialogueHandler = new DialogueHandler(ctx.db);

    // Get session
    const session = await sessionManager.getSession(
      input.sessionId,
      input.workspaceId,
    );

    if (!session) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Сессия не найдена",
      });
    }

    // If already completed or submitted, return cached result
    if (session.status === "completed" || session.status === "submitted") {
      if (
        session.evaluation &&
        session.fitDecision &&
        session.fitScore !== null
      ) {
        return {
          sessionId: session.id,
          status: session.status,
          fitDecision: session.fitDecision,
          fitScore: session.fitScore,
          feedback: session.candidateFeedback ?? "",
          canProceed: session.fitDecision !== "not_fit",
          evaluation: session.evaluation as EvaluationResult,
        };
      }
    }

    // If not in evaluating status, return current status
    if (session.status !== "evaluating") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Результат недоступен в статусе: ${session.status}`,
      });
    }

    // Perform evaluation
    try {
      const config = await sessionManager.getWorkspaceConfig(input.workspaceId);

      // Get vacancy data
      const [vacancyData] = await ctx.db
        .select()
        .from(vacancy)
        .where(eq(vacancy.id, session.vacancyId))
        .limit(1);

      if (!vacancyData) {
        throw new PrequalificationError(
          "VACANCY_NOT_FOUND",
          "Вакансия не найдена",
        );
      }

      // Get dialogue history
      let dialogueHistory: {
        role: "assistant" | "user";
        content: string;
        timestamp: Date;
      }[] = [];
      if (session.interviewSessionId) {
        dialogueHistory = await dialogueHandler.getConversationHistory(
          session.interviewSessionId,
        );
      }

      if (!session.parsedResume) {
        throw new PrequalificationError(
          "RESUME_REQUIRED",
          "Резюме не загружено",
        );
      }

      if (dialogueHistory.length === 0) {
        throw new PrequalificationError(
          "INSUFFICIENT_DIALOGUE",
          "Диалог не проведён",
        );
      }

      // Transform DB vacancy requirements to evaluation service format
      const transformedRequirements = vacancyData.requirements
        ? {
            hardSkills: [
              ...(vacancyData.requirements.mandatory_requirements ?? []),
              ...(vacancyData.requirements.tech_stack ?? []),
            ],
            softSkills: vacancyData.requirements.nice_to_have_skills ?? [],
            minExperience:
              vacancyData.requirements.experience_years?.min ?? undefined,
            education: [],
            other: vacancyData.requirements.keywords_for_matching ?? [],
          }
        : undefined;

      // Run evaluation
      const evaluationResult = await evaluatorService.evaluate({
        parsedResume: session.parsedResume,
        dialogueHistory,
        vacancy: {
          id: vacancyData.id,
          title: vacancyData.title,
          description: vacancyData.description ?? undefined,
          requirements: transformedRequirements,
        },
        workspaceConfig: {
          passThreshold: config.passThreshold,
          mandatoryQuestions: config.mandatoryQuestions,
          tone: config.tone,
          honestyLevel: config.honestyLevel,
        },
      });

      // Generate feedback for candidate
      const feedback = await feedbackGeneratorService.generateFeedback(
        evaluationResult,
        {
          honestyLevel: config.honestyLevel,
          tone: config.tone,
          fitDecision: evaluationResult.fitDecision,
          fitScore: evaluationResult.fitScore,
          vacancyTitle: vacancyData.title,
        },
      );

      // Update session with evaluation results
      await ctx.db
        .update(prequalificationSession)
        .set({
          status: "completed",
          fitScore: evaluationResult.fitScore,
          fitDecision: evaluationResult.fitDecision,
          evaluation: evaluationResult,
          candidateFeedback: feedback,
        })
        .where(
          and(
            eq(prequalificationSession.id, input.sessionId),
            eq(prequalificationSession.workspaceId, input.workspaceId),
          ),
        );

      return {
        sessionId: session.id,
        status: "completed" as const,
        fitDecision: evaluationResult.fitDecision,
        fitScore: evaluationResult.fitScore,
        feedback,
        canProceed: evaluationResult.fitDecision !== "not_fit",
        evaluation: evaluationResult,
      };
    } catch (error) {
      if (error instanceof PrequalificationError) {
        const codeMap: Record<
          string,
          "BAD_REQUEST" | "NOT_FOUND" | "FORBIDDEN"
        > = {
          SESSION_NOT_FOUND: "NOT_FOUND",
          VACANCY_NOT_FOUND: "NOT_FOUND",
          RESUME_REQUIRED: "BAD_REQUEST",
          INSUFFICIENT_DIALOGUE: "BAD_REQUEST",
          TENANT_MISMATCH: "FORBIDDEN",
        };

        throw new TRPCError({
          code: codeMap[error.code] ?? "INTERNAL_SERVER_ERROR",
          message: error.userMessage,
          cause: error,
        });
      }

      throw error;
    }
  });
