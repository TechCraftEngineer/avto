/**
 * Централизованная фабрика для создания агентов с автоматической передачей langfuse
 */

import {
  getActualProvider,
  getAIModelName,
  langfuse as globalLangfuse,
} from "@qbs-autonaim/lib/ai";
import type { LanguageModel } from "ai";
import type { Langfuse } from "langfuse";
import { BotSummaryAnalyzerAgent } from "../detection/bot-summary-analyzer";
import { BotUsageDetectorAgent } from "../detection/bot-usage-detector";
import { ContextAnalyzerAgent } from "../detection/context-analyzer";
import { EscalationDetectorAgent } from "../detection/escalation-detector";
import { GreetingDetectorAgent } from "../detection/greeting-detector";
import { ResumeStructurerAgent } from "../extraction/resume-structurer";
import { SalaryExtractionAgent } from "../extraction/salary-extraction";
import { EscalationHandlerAgent } from "../handlers/escalation-handler";
import { PinHandlerAgent } from "../handlers/pin-handler";
import { WelcomeAgent } from "../handlers/welcome";
import { InterviewCompletionAgent } from "../interview/interview-completion";
import { InterviewScoringAgent } from "../interview/interview-scoring";
import { InterviewStartAgent } from "../interview/interview-start";
import { InterviewerAgent } from "../interview/interviewer";
import { WebInterviewOrchestrator } from "../interview/web-orchestrator";
import { CommunicationAgent } from "../recruiter/actions/communication";
import { ContentGeneratorAgent } from "../recruiter/actions/content-generator";
import { VacancyAnalyticsAgent } from "../recruiter/analytics/vacancy-analytics";
import { CareerTrajectoryAgent } from "../recruiter/career-trajectory-agent";
import { IntentClassifierAgent } from "../recruiter/classification/intent-classifier";
import { InterviewQuestionsAgent } from "../recruiter/interview/interview-questions-agent";
import { PriorityAgent } from "../recruiter/priority/priority-agent";
import { CandidateEvaluatorAgent } from "../recruiter/ranking/candidate-evaluator-agent";
import { ComparisonAgent } from "../recruiter/ranking/comparison-agent";
import { RecommendationAgent } from "../recruiter/ranking/recommendation-agent";
import { SummaryAgent } from "../recruiter/ranking/summary-agent";
import { CandidateSearchAgent } from "../recruiter/search/candidate-search";
import type { AgentConfig } from "./base-agent";

export interface AgentFactoryConfig {
  model: LanguageModel;
  langfuse?: Langfuse | undefined;
  traceId?: string;
  maxSteps?: number;
  modelProvider?: "openai" | "deepseek" | "openrouter" | string;
  modelName?: string;
}

/**
 * Получает или создает singleton инстанс Langfuse
 */
function getLangfuseInstance(): Langfuse | undefined {
  return globalLangfuse;
}

/**
 * Фабрика для создания агентов с централизованной конфигурацией
 */
export class AgentFactory {
  private config: AgentFactoryConfig;
  private langfuse: Langfuse | undefined;
  private modelProvider?: string;
  private modelName?: string;

  constructor(config: AgentFactoryConfig) {
    this.config = config;
    // Используем переданный langfuse или создаем глобальный singleton
    this.langfuse = config.langfuse ?? getLangfuseInstance();
    // Автоматически определяем провайдер и модель, если не переданы явно
    this.modelProvider = config.modelProvider ?? getActualProvider();
    this.modelName = config.modelName ?? getAIModelName(this.modelProvider);
  }

  private getAgentConfig(overrides?: Partial<AgentConfig>): AgentConfig {
    return {
      model: this.config.model,
      langfuse: this.langfuse,
      traceId: this.config.traceId,
      maxSteps: this.config.maxSteps,
      modelProvider: this.modelProvider,
      modelName: this.modelName,
      ...overrides,
    };
  }

  createContextAnalyzer(overrides?: Partial<AgentConfig>) {
    return new ContextAnalyzerAgent(this.getAgentConfig(overrides));
  }

  createEscalationDetector(overrides?: Partial<AgentConfig>) {
    return new EscalationDetectorAgent(this.getAgentConfig(overrides));
  }

  createEscalationHandler(overrides?: Partial<AgentConfig>) {
    return new EscalationHandlerAgent(this.getAgentConfig(overrides));
  }

  createGreetingDetector(overrides?: Partial<AgentConfig>) {
    return new GreetingDetectorAgent(this.getAgentConfig(overrides));
  }

  createInterviewCompletion(overrides?: Partial<AgentConfig>) {
    return new InterviewCompletionAgent(this.getAgentConfig(overrides));
  }

  createInterviewScoring(overrides?: Partial<AgentConfig>) {
    return new InterviewScoringAgent(this.getAgentConfig(overrides));
  }

  createInterviewStart(overrides?: Partial<AgentConfig>) {
    return new InterviewStartAgent(this.getAgentConfig(overrides));
  }

  createInterviewer(overrides?: Partial<AgentConfig>) {
    return new InterviewerAgent(this.getAgentConfig(overrides));
  }

  createWebInterviewOrchestrator(overrides?: Partial<AgentConfig>) {
    return new WebInterviewOrchestrator(this.getAgentConfig(overrides));
  }

  createCareerTrajectoryAgent(overrides?: Partial<AgentConfig>) {
    return new CareerTrajectoryAgent(this.getAgentConfig(overrides));
  }

  createCommunicationAgent(overrides?: Partial<AgentConfig>) {
    return new CommunicationAgent(this.getAgentConfig(overrides));
  }

  createContentGeneratorAgent(overrides?: Partial<AgentConfig>) {
    return new ContentGeneratorAgent(this.getAgentConfig(overrides));
  }

  createVacancyAnalyticsAgent(overrides?: Partial<AgentConfig>) {
    return new VacancyAnalyticsAgent(this.getAgentConfig(overrides));
  }

  createIntentClassifierAgent(overrides?: Partial<AgentConfig>) {
    return new IntentClassifierAgent(this.getAgentConfig(overrides));
  }

  createInterviewQuestionsAgent(overrides?: Partial<AgentConfig>) {
    return new InterviewQuestionsAgent(this.getAgentConfig(overrides));
  }

  createPriorityAgent(overrides?: Partial<AgentConfig>) {
    return new PriorityAgent(this.getAgentConfig(overrides));
  }

  createCandidateEvaluatorAgent(overrides?: Partial<AgentConfig>) {
    return new CandidateEvaluatorAgent(this.getAgentConfig(overrides));
  }

  createComparisonAgent(overrides?: Partial<AgentConfig>) {
    return new ComparisonAgent(this.getAgentConfig(overrides));
  }

  createRecommendationAgent(overrides?: Partial<AgentConfig>) {
    return new RecommendationAgent(this.getAgentConfig(overrides));
  }

  createSummaryAgent(overrides?: Partial<AgentConfig>) {
    return new SummaryAgent(this.getAgentConfig(overrides));
  }

  createCandidateSearchAgent(overrides?: Partial<AgentConfig>) {
    return new CandidateSearchAgent(this.getAgentConfig(overrides));
  }

  createPinHandler(overrides?: Partial<AgentConfig>) {
    return new PinHandlerAgent(this.getAgentConfig(overrides));
  }

  createResumeStructurer(overrides?: Partial<AgentConfig>) {
    return new ResumeStructurerAgent(this.getAgentConfig(overrides));
  }

  createSalaryExtraction(overrides?: Partial<AgentConfig>) {
    return new SalaryExtractionAgent(this.getAgentConfig(overrides));
  }

  createWelcome(overrides?: Partial<AgentConfig>) {
    return new WelcomeAgent(this.getAgentConfig(overrides));
  }

  createBotUsageDetector(overrides?: Partial<AgentConfig>) {
    return new BotUsageDetectorAgent(this.getAgentConfig(overrides));
  }

  createBotSummaryAnalyzer(overrides?: Partial<AgentConfig>) {
    return new BotSummaryAnalyzerAgent(this.getAgentConfig(overrides));
  }
}
