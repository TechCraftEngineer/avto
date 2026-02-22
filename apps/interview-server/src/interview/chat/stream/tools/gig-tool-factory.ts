import type * as schema from "@qbs-autonaim/db/schema";
import type { LanguageModel, ToolSet } from "ai";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
  GigLike,
  InterviewContextLite,
  VacancyLike,
} from "../strategies/types";
import { BaseToolFactory } from "./base-tool-factory";
import { createGetInterviewProfileTool } from "./profile";
import type { ToolAvailability } from "./types";

/**
 * Фабрика инструментов для интервью по разовым заданиям (gig)
 */
export class GigToolFactory extends BaseToolFactory {
  constructor() {
    super("gig");
  }

  /**
   * Переопределяет доступность инструментов для gig
   * Добавляет gig-специфичный инструмент getInterviewProfile
   */
  protected defineToolAvailability(): ToolAvailability[] {
    const baseTools = super.defineToolAvailability();

    // Добавляем gig-специфичный инструмент
    return [
      ...baseTools,
      {
        name: "getInterviewProfile",
        availableOnStages: [
          "intro",
          "profile_review",
          "org",
          "tech",
          "task_approach",
        ],
      },
    ];
  }

  /**
   * Создает набор инструментов для gig интервью
   * Включает базовые инструменты + getInterviewProfile
   */
  create(
    model: LanguageModel,
    sessionId: string,
    db: NodePgDatabase<typeof schema>,
    gig: GigLike | null,
    vacancy: VacancyLike | null,
    interviewContext: InterviewContextLite,
  ): ToolSet {
    const baseTools = super.create(
      model,
      sessionId,
      db,
      gig,
      vacancy,
      interviewContext,
    );

    // Добавляем gig-специфичный инструмент
    return {
      ...baseTools,
      getInterviewProfile: createGetInterviewProfileTool(sessionId, db),
    };
  }
}
