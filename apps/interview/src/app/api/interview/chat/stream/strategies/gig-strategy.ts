import { GigSystemPromptBuilder } from "../prompts/gig-prompt-builder";
import type { SystemPromptBuilder } from "../prompts/types";
import { gigScoringSchema } from "../scoring/schemas";
import { gigStages } from "../stages/gig-stages";
import { GigToolFactory } from "../tools/gig-tool-factory";
import { BaseInterviewStrategy } from "./base-strategy";
import type {
  InterviewState,
  QuestionBankConfig,
  QuestionBankResult,
  ScoringConfig,
  ToolFactory,
  TransitionContext,
} from "./types";

/**
 * Стратегия интервью для разовых заданий (gig)
 * Фокусируется на оценке для фриланс работы
 */
export class GigInterviewStrategy extends BaseInterviewStrategy {
  readonly entityType = "gig" as const;

  protected _questionBank: QuestionBankConfig = {
    organizationalDefaults: [],
    technicalDefaults: [],
    customQuestionsField: "customInterviewQuestions",
  };

  protected _scoring: ScoringConfig = {
    schema: gigScoringSchema,
    version: "v3-gig",
    includesAuthenticityPenalty: true,
  };

  protected _stages = gigStages;

  readonly systemPromptBuilder: SystemPromptBuilder =
    new GigSystemPromptBuilder();
  readonly toolFactory: ToolFactory = new GigToolFactory();

  getWelcomeMessage() {
    return {
      title: "Добро пожаловать!",
      subtitle: "Готовы обсудить это задание?",
      placeholder: "Расскажите о вашем опыте...",
      greeting: "Напишите сообщение, чтобы начать разговор о задании",
    };
  }

  getContextCardData(_entity: import("./types").GigLike) {
    return {
      badgeLabel: "Разовое задание",
      fields: [
        {
          key: "title",
          label: "Название",
          type: "text" as const,
          showFor: ["gig" as const],
        },
        {
          key: "budget",
          label: "Бюджет",
          type: "currency" as const,
          showFor: ["gig" as const],
        },
        {
          key: "deadline",
          label: "Дедлайн",
          type: "date" as const,
          showFor: ["gig" as const],
        },
        {
          key: "estimatedDuration",
          label: "Срок выполнения",
          type: "text" as const,
          showFor: ["gig" as const],
        },
      ],
      expandableFields: [
        {
          key: "description",
          label: "Описание",
          type: "text" as const,
          showFor: ["gig" as const],
        },
        {
          key: "requirements",
          label: "Требования",
          type: "array" as const,
          showFor: ["gig" as const],
        },
      ],
    };
  }

  /**
   * Переопределяет логику переходов между стадиями для gig
   * Учитывает не только количество, но и качество ответов
   */
  canTransition(from: string, to: string, context: TransitionContext): boolean {
    let canTransition = false;
    let reason = "";

    // Проверяем качество ответов только для текущей стадии
    const currentStageResponses = context.userResponses.filter(
      (r) => r.length > 50,
    );
    const hasGoodResponses = currentStageResponses.length >= 2;
    const noBotSuspicion =
      !context.botDetectionScore || context.botDetectionScore < 0.7;

    // Из intro можно перейти в profile_review или org
    if (from === "intro" && (to === "profile_review" || to === "org")) {
      const hasMinQuestions = context.askedQuestions.length >= 1;
      canTransition = hasMinQuestions && hasGoodResponses && noBotSuspicion;
      reason = canTransition
        ? "quality_criteria_met"
        : "quality_criteria_not_met";
    }
    // Из profile_review в org
    else if (from === "profile_review" && to === "org") {
      canTransition = hasGoodResponses && noBotSuspicion;
      reason = canTransition
        ? "quality_criteria_met"
        : "quality_criteria_not_met";
    }
    // Из org в tech
    else if (from === "org" && to === "tech") {
      const hasMinQuestions = context.askedQuestions.length >= 3;
      canTransition = hasMinQuestions && hasGoodResponses && noBotSuspicion;
      reason = canTransition
        ? "quality_criteria_met"
        : "quality_criteria_not_met";
    }
    // Из tech в task_approach
    else if (from === "tech" && to === "task_approach") {
      const hasMinQuestions = context.askedQuestions.length >= 5;
      canTransition = hasMinQuestions && hasGoodResponses && noBotSuspicion;
      reason = canTransition
        ? "quality_criteria_met"
        : "quality_criteria_not_met";
    }
    // Из task_approach в wrapup (NOTE: noBotSuspicion intentionally omitted here as final stage allows completion regardless)
    else if (from === "task_approach" && to === "wrapup") {
      const hasMinQuestions = context.askedQuestions.length >= 7;
      canTransition = hasMinQuestions && hasGoodResponses;
      reason = canTransition
        ? "quality_criteria_met"
        : "quality_criteria_not_met";
    } else {
      canTransition = super.canTransition(from, to, context);
      reason = "fallback_to_base";
    }

    // Логируем только в development режиме для оптимизации производительности
    if (process.env.NODE_ENV === "development") {
      console.log(`[Interview Strategy] Проверка перехода стадии`, {
        entityType: this.entityType,
        from,
        to,
        canTransition,
        reason,
        context: {
          askedQuestionsCount: context.askedQuestions.length,
          userResponsesCount: context.userResponses.length,
          goodResponsesCount: context.userResponses.filter((r) => r.length > 50)
            .length,
          botDetectionScore: context.botDetectionScore,
          timeInCurrentStage: context.timeInCurrentStage,
        },
        timestamp: new Date().toISOString(),
      });
    }

    return canTransition;
  }

  /**
   * Не используем жёстко заданные вопросы - бот генерирует их сам
   */
  getNextQuestion(
    _questionBank: QuestionBankResult,
    _interviewState: InterviewState,
  ): string | null {
    // Бот сам генерирует вопросы на основе промпта и контекста
    return null;
  }
}
