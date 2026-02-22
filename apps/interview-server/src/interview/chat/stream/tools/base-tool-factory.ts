import type * as schema from "@qbs-autonaim/db/schema";
import type { LanguageModel, ToolSet } from "ai";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { StageId } from "../stages/types";
import type {
  GigLike,
  InterviewContextLite,
  SupportedEntityType,
  ToolFactory,
  VacancyLike,
} from "../strategies/types";
import {
  createAnalyzeResponseAuthenticityTool,
  createCompleteInterviewTool,
  createGetBotDetectionSummaryTool,
  createGetInterviewPolicyTool,
  createGetInterviewQuestionBankTool,
  createGetInterviewSettingsTool,
  createGetInterviewStateTool,
  createGetScoringRubricTool,
  createSaveInterviewNoteTool,
  createSaveQuestionAnswerTool,
  createUpdateInterviewStateTool,
} from "./index";
import type { ToolAvailability } from "./types";

/**
 * Базовая фабрика инструментов
 * Содержит общую логику для создания инструментов всех типов интервью
 */
export abstract class BaseToolFactory implements ToolFactory {
  protected readonly entityType: SupportedEntityType;
  protected readonly toolAvailability: ToolAvailability[];

  constructor(entityType: SupportedEntityType) {
    this.entityType = entityType;
    this.toolAvailability = this.defineToolAvailability();
  }

  /**
   * Определяет доступность инструментов по стадиям
   * Переопределяется в наследниках для добавления специфичных инструментов
   */
  protected defineToolAvailability(): ToolAvailability[] {
    return [
      // Инструменты доступные на всех стадиях
      {
        name: "getInterviewSettings",
        availableOnAllStages: true,
        availableOnStages: [],
      },
      {
        name: "getInterviewPolicy",
        availableOnAllStages: true,
        availableOnStages: [],
      },
      {
        name: "getInterviewState",
        availableOnAllStages: true,
        availableOnStages: [],
      },
      {
        name: "updateInterviewState",
        availableOnAllStages: true,
        availableOnStages: [],
      },
      {
        name: "saveInterviewNote",
        availableOnAllStages: true,
        availableOnStages: [],
      },
      {
        name: "saveQuestionAnswer",
        availableOnAllStages: true,
        availableOnStages: [],
      },
      {
        name: "analyzeResponseAuthenticity",
        availableOnAllStages: true,
        availableOnStages: [],
      },
      {
        name: "getBotDetectionSummary",
        availableOnAllStages: true,
        availableOnStages: [],
      },

      // Инструменты доступные на конкретных стадиях
      {
        name: "getInterviewQuestionBank",
        availableOnStages: [
          "intro",
          "org",
          "tech",
          "profile_review",
          "task_approach",
          "motivation",
        ],
      },
      {
        name: "getScoringRubric",
        availableOnStages: ["wrapup"],
      },
      {
        name: "completeInterview",
        availableOnStages: ["wrapup"],
      },
    ];
  }

  /**
   * Создает базовый набор инструментов
   */
  create(
    model: LanguageModel,
    sessionId: string,
    _db: NodePgDatabase<typeof schema>,
    gig: GigLike | null,
    vacancy: VacancyLike | null,
    interviewContext: InterviewContextLite,
  ): ToolSet {
    // Определяем entityType на основе this.entityType
    // Маппинг "project" -> "vacancy" для совместимости с ScoringFactory
    const entityType: "gig" | "vacancy" | "unknown" =
      this.entityType === "gig"
        ? "gig"
        : this.entityType === "vacancy" || this.entityType === "project"
          ? "vacancy"
          : "unknown";

    return {
      getInterviewSettings: createGetInterviewSettingsTool(
        gig,
        vacancy,
        interviewContext,
        entityType,
      ),
      getInterviewPolicy: createGetInterviewPolicyTool(entityType),
      getInterviewState: createGetInterviewStateTool(sessionId),
      updateInterviewState: createUpdateInterviewStateTool(sessionId),
      getInterviewQuestionBank: createGetInterviewQuestionBankTool(
        model,
        sessionId,
        gig,
        vacancy,
        entityType,
      ),
      getScoringRubric: createGetScoringRubricTool(sessionId, entityType),
      saveInterviewNote: createSaveInterviewNoteTool(sessionId),
      saveQuestionAnswer: createSaveQuestionAnswerTool(sessionId),
      analyzeResponseAuthenticity: createAnalyzeResponseAuthenticityTool(
        sessionId,
        model,
      ),
      getBotDetectionSummary: createGetBotDetectionSummaryTool(
        sessionId,
        model,
      ),
      completeInterview: createCompleteInterviewTool(sessionId),
    };
  }

  /**
   * Возвращает список доступных инструментов для указанной стадии
   */
  getAvailableTools(stage: string): string[] {
    return this.toolAvailability
      .filter(
        (tool) =>
          tool.availableOnAllStages ||
          tool.availableOnStages.includes(stage as StageId),
      )
      .map((tool) => tool.name);
  }

  /**
   * Проверяет доступность инструмента на указанной стадии
   */
  isToolAvailable(toolName: string, stage: string): boolean {
    const tool = this.toolAvailability.find((t) => t.name === toolName);
    if (!tool) return false;

    return (
      tool.availableOnAllStages ||
      tool.availableOnStages.includes(stage as StageId)
    );
  }
}
