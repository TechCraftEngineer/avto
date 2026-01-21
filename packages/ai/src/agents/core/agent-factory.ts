/**
 * Централизованная фабрика для создания агентов с автоматической передачей langfuse
 */

import type { LanguageModel } from "ai";
import { langfuse as globalLangfuse } from "@qbs-autonaim/lib/ai";
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
import type { AgentConfig } from "./base-agent";

export interface AgentFactoryConfig {
  model: LanguageModel;
  langfuse?: Langfuse | undefined;
  traceId?: string;
  maxSteps?: number;
  modelProvider?: "openai" | "deepseek" | string;
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
    this.modelProvider = config.modelProvider;
    this.modelName = config.modelName;
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
