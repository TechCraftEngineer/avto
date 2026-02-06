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
    organizationalDefaults: [
      "Какой график работы вам подходит?",
      "Какие ожидания по зарплате?",
      "Когда готовы приступить к работе?",
      "Какой формат работы предпочитаете?",
    ],
    technicalDefaults: [
      "Расскажите о вашем опыте работы с релевантными технологиями",
      "Опишите самый сложный проект, над которым вы работали",
      "Как вы подходите к решению технических проблем?",
      "Какие технологии вы хотели бы изучить в ближайшее время?",
    ],
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
      suggestedQuestions: [
        "Почему вас заинтересовала эта вакансия?",
        "Какие у вас сильные стороны?",
      ],
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
   */
  canTransition(from: string, to: string, context: TransitionContext): boolean {
    // Специфичная логика переходов для vacancy интервью

    let canTransition = false;
    let reason = "";

    // Из intro в org
    if (from === "intro" && to === "org") {
      canTransition = context.askedQuestions.length >= 1;
      reason = canTransition ? "min_questions_met" : "min_questions_not_met";
    }
    // Из org в tech
    else if (from === "org" && to === "tech") {
      canTransition = context.askedQuestions.length >= 3;
      reason = canTransition ? "min_questions_met" : "min_questions_not_met";
    }
    // Из tech в motivation
    else if (from === "tech" && to === "motivation") {
      canTransition = context.askedQuestions.length >= 5;
      reason = canTransition ? "min_questions_met" : "min_questions_not_met";
    }
    // Из motivation в wrapup
    else if (from === "motivation" && to === "wrapup") {
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
   * Переопределяет логику получения следующего вопроса для vacancy
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
      case "org":
        availableQuestions = questionBank.organizational;
        break;
      case "tech":
        availableQuestions = questionBank.technical;
        break;
      case "motivation":
        // Вопросы о мотивации и долгосрочных целях
        availableQuestions = [
          "Почему вас заинтересовала эта позиция?",
          "Какие у вас карьерные цели на ближайшие 2-3 года?",
          "Что для вас важно в работе и команде?",
          "Почему вы хотите сменить текущее место работы?",
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
