import type { LanguageModel, ToolSet } from 'ai';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '@qbs-autonaim/db/schema';
import type { ToolFactory, GigLike, VacancyLike, InterviewContextLite, SupportedEntityType } from '../strategies/types';
import type { StageId } from '../stages/types';
import type { ToolAvailability } from './types';
import {
  createGetInterviewSettingsTool,
  createGetInterviewPolicyTool,
  createGetInterviewStateTool,
  createUpdateInterviewStateTool,
  createGetInterviewQuestionBankTool,
  createGetScoringRubricTool,
  createSaveInterviewNoteTool,
  createSaveQuestionAnswerTool,
  createAnalyzeResponseAuthenticityTool,
  createGetBotDetectionSummaryTool,
  createCompleteInterviewTool,
} from './index';

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
      { name: 'getInterviewSettings', availableOnAllStages: true, availableOnStages: [] },
      { name: 'getInterviewPolicy', availableOnAllStages: true, availableOnStages: [] },
      { name: 'getInterviewState', availableOnAllStages: true, availableOnStages: [] },
      { name: 'updateInterviewState', availableOnAllStages: true, availableOnStages: [] },
      { name: 'saveInterviewNote', availableOnAllStages: true, availableOnStages: [] },
      { name: 'saveQuestionAnswer', availableOnAllStages: true, availableOnStages: [] },
      { name: 'analyzeResponseAuthenticity', availableOnAllStages: true, availableOnStages: [] },
      { name: 'getBotDetectionSummary', availableOnAllStages: true, availableOnStages: [] },
      
      // Инструменты доступные на конкретных стадиях
      { 
        name: 'getInterviewQuestionBank', 
        availableOnStages: ['intro', 'org', 'tech', 'profile_review', 'task_approach', 'motivation'] 
      },
      { 
        name: 'getScoringRubric', 
        availableOnStages: ['wrapup'] 
      },
      { 
        name: 'completeInterview', 
        availableOnStages: ['wrapup'] 
      },
    ];
  }

  /**
   * Создает базовый набор инструментов
   */
  create(
    model: LanguageModel,
    sessionId: string,
    db: NodePgDatabase<typeof schema>,
    gig: GigLike | null,
    vacancy: VacancyLike | null,
    interviewContext: InterviewContextLite,
  ): ToolSet {
    return {
      getInterviewSettings: createGetInterviewSettingsTool(
        gig,
        vacancy,
        interviewContext,
        this.entityType,
      ),
      getInterviewPolicy: createGetInterviewPolicyTool(this.entityType),
      getInterviewState: createGetInterviewStateTool(sessionId),
      updateInterviewState: createUpdateInterviewStateTool(sessionId),
      getInterviewQuestionBank: createGetInterviewQuestionBankTool(
        model,
        sessionId,
        gig,
        vacancy,
        this.entityType,
      ),
      getScoringRubric: createGetScoringRubricTool(sessionId, this.entityType),
      saveInterviewNote: createSaveInterviewNoteTool(sessionId),
      saveQuestionAnswer: createSaveQuestionAnswerTool(sessionId),
      analyzeResponseAuthenticity: createAnalyzeResponseAuthenticityTool(
        sessionId,
        model,
      ),
      getBotDetectionSummary: createGetBotDetectionSummaryTool(sessionId, model),
      completeInterview: createCompleteInterviewTool(sessionId),
    };
  }

  /**
   * Возвращает список доступных инструментов для указанной стадии
   */
  getAvailableTools(stage: string): string[] {
    return this.toolAvailability
      .filter(tool => 
        tool.availableOnAllStages || 
        tool.availableOnStages.includes(stage as StageId)
      )
      .map(tool => tool.name);
  }

  /**
   * Проверяет доступность инструмента на указанной стадии
   */
  isToolAvailable(toolName: string, stage: string): boolean {
    const tool = this.toolAvailability.find(t => t.name === toolName);
    if (!tool) return false;
    
    return tool.availableOnAllStages || 
           tool.availableOnStages.includes(stage as StageId);
  }
}
