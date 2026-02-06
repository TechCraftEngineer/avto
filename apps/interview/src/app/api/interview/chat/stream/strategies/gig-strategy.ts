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
    organizationalDefaults: [
      "Расскажите о вашем опыте работы с аналогичными задачами",
      "Как вы оцениваете сложность этого задания и сроки выполнения?",
      "Какую оплату за задание вы ожидаете?",
      "Есть ли другие проекты, которые могут повлиять на сроки?",
    ],
    technicalDefaults: [
      "Какие технологии вы планируете использовать для выполнения задания?",
      "Опишите ваш подход к решению этой задачи",
      "Сталкивались ли вы с подобными техническими вызовами ранее?",
      "Как вы будете обеспечивать качество результата?",
    ],
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
      suggestedQuestions: [
        "Расскажите о вашем опыте с аналогичными задачами",
        "Как бы вы подошли к решению этой задачи?",
        "Какие сроки вам нужны для выполнения?",
      ],
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
   */
  canTransition(from: string, to: string, context: TransitionContext): boolean {
    // Специфичная логика переходов для gig интервью

    let canTransition = false;
    let reason = "";

    // Из intro можно перейти в profile_review или org
    if (from === "intro" && (to === "profile_review" || to === "org")) {
      canTransition = context.askedQuestions.length >= 1;
      reason = canTransition ? "min_questions_met" : "min_questions_not_met";
    }
    // Из profile_review в org
    else if (from === "profile_review" && to === "org") {
      canTransition = true;
      reason = "always_allowed";
    }
    // Из org в tech
    else if (from === "org" && to === "tech") {
      canTransition = context.askedQuestions.length >= 3;
      reason = canTransition ? "min_questions_met" : "min_questions_not_met";
    }
    // Из tech в task_approach
    else if (from === "tech" && to === "task_approach") {
      canTransition = context.askedQuestions.length >= 5;
      reason = canTransition ? "min_questions_met" : "min_questions_not_met";
    }
    // Из task_approach в wrapup
    else if (from === "task_approach" && to === "wrapup") {
      canTransition = context.askedQuestions.length >= 7;
      reason = canTransition ? "min_questions_met" : "min_questions_not_met";
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
          botDetectionScore: context.botDetectionScore,
          timeInCurrentStage: context.timeInCurrentStage,
        },
        timestamp: new Date().toISOString(),
      });
    }

    return canTransition;
  }

  /**
   * Переопределяет логику получения следующего вопроса для gig
   */
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
      case "profile_review":
        // На этой стадии вопросы генерируются на основе профиля
        return null;
      case "org":
        availableQuestions = questionBank.organizational;
        break;
      case "tech":
        availableQuestions = questionBank.technical;
        break;
      case "task_approach":
        // Вопросы о подходе к выполнению задания
        availableQuestions = [
          "Как вы планируете подойти к выполнению этого задания?",
          "Какие этапы работы вы выделяете?",
          "Как вы будете контролировать прогресс?",
        ];
        break;
      case "wrapup":
        return null;
      default:
        availableQuestions = questionBank.organizational;
    }

    return availableQuestions.find((q) => !asked.has(q)) || null;
  }
}
