import type { SystemPromptBuilder } from "../prompts/types";
import { VacancySystemPromptBuilder } from "../prompts/vacancy-prompt-builder";
import { vacancyScoringSchema } from "../scoring/schemas";
import { vacancyStages } from "../stages/vacancy-stages";
import { VacancyToolFactory } from "../tools/vacancy-tool-factory";
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
 * Стратегия интервью для вакансий
 * Фокусируется на оценке для постоянного трудоустройства
 */
export class VacancyInterviewStrategy extends BaseInterviewStrategy {
  readonly entityType = "vacancy" as const;

  protected _questionBank: QuestionBankConfig = {
    organizationalDefaults: [],
    technicalDefaults: [],
    customQuestionsField: "customInterviewQuestions",
  };

  protected _scoring: ScoringConfig = {
    schema: vacancyScoringSchema,
    version: "v2",
    includesAuthenticityPenalty: true,
  };

  protected _stages = vacancyStages;

  readonly systemPromptBuilder: SystemPromptBuilder =
    new VacancySystemPromptBuilder();
  readonly toolFactory: ToolFactory = new VacancyToolFactory();

  getWelcomeMessage() {
    return {
      title: "Добро пожаловать!",
      subtitle: "Ответьте на несколько вопросов о себе",
      placeholder: "Расскажите о себе...",
      greeting: "Напишите сообщение, чтобы начать разговор",
    };
  }

  getContextCardData(_entity: import("./types").VacancyLike) {
    return {
      badgeLabel: "Вакансия",
      fields: [
        {
          key: "title",
          label: "Название",
          type: "text" as const,
          showFor: ["vacancy" as const],
        },
        {
          key: "region",
          label: "Регион",
          type: "text" as const,
          showFor: ["vacancy" as const],
        },
        {
          key: "workLocation",
          label: "Место работы",
          type: "text" as const,
          showFor: ["vacancy" as const],
        },
      ],
      expandableFields: [
        {
          key: "description",
          label: "Описание",
          type: "text" as const,
          showFor: ["vacancy" as const],
        },
        {
          key: "requirements",
          label: "Требования",
          type: "array" as const,
          showFor: ["vacancy" as const],
        },
      ],
    };
  }

  /**
   * Переопределяет логику переходов между стадиями для vacancy
   * Учитывает не только количество, но и качество ответов
   */
  canTransition(from: string, to: string, context: TransitionContext): boolean {
    let canTransition = false;
    let reason = "";

    // Проверяем качество ответов
    const hasGoodResponses =
      context.userResponses.filter((r) => r.length > 50).length >= 2;
    const noBotSuspicion =
      !context.botDetectionScore || context.botDetectionScore < 0.7;

    // Из intro в org
    if (from === "intro" && to === "org") {
      const hasMinQuestions = context.askedQuestions.length >= 1;
      canTransition = hasMinQuestions && hasGoodResponses && noBotSuspicion;
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
    // Из tech в motivation
    else if (from === "tech" && to === "motivation") {
      const hasMinQuestions = context.askedQuestions.length >= 5;
      canTransition = hasMinQuestions && hasGoodResponses && noBotSuspicion;
      reason = canTransition
        ? "quality_criteria_met"
        : "quality_criteria_not_met";
    }
    // Из motivation в wrapup
    else if (from === "motivation" && to === "wrapup") {
      const hasMinQuestions = context.askedQuestions.length >= 7;
      canTransition = hasMinQuestions && hasGoodResponses && noBotSuspicion;
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
