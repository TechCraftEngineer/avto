import type * as schema from "@qbs-autonaim/db/schema";
import type { LanguageModel, ToolSet } from "ai";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { ZodType } from "zod";
import type { SystemPromptBuilder } from "../prompts/types";
import type { InterviewStageConfig } from "../stages/types";
import type {
  ContextCardConfig,
  GigLike,
  InterviewContextLite,
  InterviewState,
  InterviewStrategy,
  QuestionBankConfig,
  QuestionBankResult,
  ScoringConfig,
  SupportedEntityType,
  ToolFactory,
  TransitionContext,
  VacancyLike,
  WelcomeMessageConfig,
} from "./types";

/**
 * Базовая абстрактная стратегия интервью с общей функциональностью
 */
export abstract class BaseInterviewStrategy implements InterviewStrategy {
  abstract readonly entityType: SupportedEntityType;

  protected abstract _questionBank: QuestionBankConfig;
  protected abstract _scoring: ScoringConfig;
  protected abstract _stages: InterviewStageConfig[];

  abstract readonly systemPromptBuilder: SystemPromptBuilder;
  abstract readonly toolFactory: ToolFactory;

  get stages(): InterviewStageConfig[] {
    return this._stages;
  }

  get stageTransitions(): import("./types").StageTransitionConfig[] {
    return [];
  }

  get questionBank(): QuestionBankConfig {
    return this._questionBank;
  }

  get scoring(): ScoringConfig {
    return this._scoring;
  }

  getWelcomeMessage(): WelcomeMessageConfig {
    return {
      title: "Добро пожаловать!",
      subtitle: "Готовы начать интервью?",
      placeholder: "Напишите сообщение...",
      greeting: "Напишите сообщение, чтобы начать диалог",
    };
  }

  getContextCardData(_entity: GigLike | VacancyLike): ContextCardConfig {
    return {
      badgeLabel: "Интервью",
      fields: [
        {
          key: "title",
          label: "Название",
          type: "text",
          showFor: ["gig", "vacancy"],
        },
      ],
    };
  }

  createTools(
    model: LanguageModel,
    sessionId: string,
    db: NodePgDatabase<typeof schema>,
    gig: GigLike | null,
    vacancy: VacancyLike | null,
    interviewContext: InterviewContextLite,
    _currentStage: string,
  ): ToolSet {
    return this.toolFactory.create(
      model,
      sessionId,
      db,
      gig,
      vacancy,
      interviewContext,
    );
  }

  createScoringSchema(): ZodType {
    return this._scoring.schema;
  }

  canTransition(from: string, to: string, context: TransitionContext): boolean {
    // По умолчанию разрешаем все переходы
    const canTransition = true;

    console.log(`[Interview Strategy] Проверка перехода стадии`, {
      entityType: this.entityType,
      from,
      to,
      canTransition,
      reason: "default_allow_all",
      context: {
        askedQuestionsCount: context.askedQuestions.length,
        userResponsesCount: context.userResponses.length,
        botDetectionScore: context.botDetectionScore,
        timeInCurrentStage: context.timeInCurrentStage,
      },
      timestamp: new Date().toISOString(),
    });

    return canTransition;
  }

  getNextQuestion(
    questionBank: QuestionBankResult,
    interviewState: InterviewState,
  ): string | null {
    const stage = interviewState.stage;
    const asked = new Set(interviewState.askedQuestions);

    let availableQuestions: string[];
    switch (stage) {
      case "intro":
        availableQuestions = questionBank.organizational.slice(0, 2);
        break;
      case "org":
        availableQuestions = questionBank.organizational;
        break;
      case "tech":
        availableQuestions = questionBank.technical;
        break;
      case "wrapup":
        return null;
      default:
        availableQuestions = questionBank.organizational;
    }

    return availableQuestions.find((q) => !asked.has(q)) || null;
  }
}
