import { AgentFactory, InterviewOrchestrator } from "@qbs-autonaim/ai";
import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { interviewSession } from "@qbs-autonaim/db/schema";
import { getAIModel, getDownloadUrl } from "@qbs-autonaim/lib";
import {
  getInterviewSessionMetadata,
  updateInterviewSessionMetadata,
} from "@qbs-autonaim/server-utils";
import { stripHtml } from "string-strip-html";
import type { InterviewAnalysis } from "../../schemas/interview";
import { createLogger, INTERVIEW } from "../base";

const logger = createLogger("Interview");

// ==================== TYPES ====================

/** Question and answer pair from interview */
interface QuestionAnswer {
  question: string;
  answer: string;
}

/** Typed metadata structure for interviewSession */
interface InterviewSessionMetadata {
  questionAnswers?: QuestionAnswer[];
}

/** Extended interview analysis with escalation support */
interface ExtendedInterviewAnalysis extends InterviewAnalysis {
  shouldEscalate?: boolean;
  escalationReason?: string;
  waitingForCandidateResponse?: boolean;
  isSimpleAcknowledgment?: boolean;
}

interface InterviewContext {
  chatSessionId: string;
  candidateName: string | null;
  vacancyTitle: string | null;
  vacancyDescription: string | null;
  questionNumber: number;
  responseId: string | null;
  gigResponseId: string | null;
  resumeLanguage?: string | null;
  conversationHistory?: Array<{
    sender: "user" | "assistant";
    content: string;
    contentType?: "text" | "voice";
    timestamp: Date | string; // Обязательное поле для расчета времени ответа
  }>;
  // Настройки бота
  botSettings?: {
    botName?: string;
    botRole?: string;
    companyName?: string;
    companyDescription?: string;
  };
  // Настройки вакансии
  customBotInstructions?: string | null;
  customOrganizationalQuestions?: string | null;
  customInterviewQuestions?: string | null;
  // Медиафайлы для показа кандидату
  interviewMediaFiles?: Array<{
    id: string;
    fileName: string;
    mimeType: string;
    url: string;
  }>;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Safely converts metadata to typed object
 */
function parseMetadata(
  metadata: Record<string, unknown> | null,
): InterviewSessionMetadata {
  if (!metadata) return {};

  return metadata as InterviewSessionMetadata;
}

/**
 * Создает AI модель для агентов
 */
function createAgentModel() {
  return getAIModel();
}

// ==================== MAIN FUNCTIONS ====================

/**
 * Analyzes candidate's answer and generates next question
 */
export async function analyzeAndGenerateNextQuestion(
  context: InterviewContext,
): Promise<ExtendedInterviewAnalysis> {
  const { questionNumber, candidateName, vacancyTitle, vacancyDescription } =
    context;

  // Валидация входных данных
  if (!Number.isFinite(questionNumber) || questionNumber < 0) {
    logger.error("Invalid questionNumber in analyzeAndGenerateNextQuestion", {
      chatSessionId: context.chatSessionId,
      questionNumber,
      type: typeof questionNumber,
    });
    throw new Error("questionNumber must be a non-negative number");
  }

  // Создаем оркестратор
  const model = createAgentModel();
  const orchestrator = new InterviewOrchestrator({ model });

  // Формируем контекст для агентов (конвертируем роли для совместимости с AI)
  const agentContext = {
    candidateId: context.chatSessionId,
    conversationId: context.chatSessionId,
    candidateName: candidateName ?? undefined,
    vacancyTitle: vacancyTitle ?? undefined,
    vacancyDescription: vacancyDescription ?? undefined,
    conversationHistory: (context.conversationHistory || []).map((msg) => ({
      sender:
        msg.sender === "user" ? "CANDIDATE" : ("BOT" as "CANDIDATE" | "BOT"),
      content: msg.content,
      contentType: msg.contentType
        ? ((msg.contentType === "text" ? "TEXT" : "VOICE") as "TEXT" | "VOICE")
        : undefined,
      timestamp: msg.timestamp,
    })),
    botSettings: context.botSettings,
    customBotInstructions: context.customBotInstructions,
    customOrganizationalQuestions: context.customOrganizationalQuestions,
    customInterviewQuestions: context.customInterviewQuestions,
  };

  // Выполняем оркестратор
  const result = await orchestrator.execute(
    {
      questionNumber,
      customOrganizationalQuestions: context.customOrganizationalQuestions,
      customInterviewQuestions: context.customInterviewQuestions,
      resumeLanguage: context.resumeLanguage || "ru",
    },
    agentContext,
  );

  logger.info("Interview orchestrator trace", {
    chatSessionId: context.chatSessionId,
    trace: result.agentTrace.map(
      (t: { agent: string; decision: string; timestamp: Date }) => ({
        agent: t.agent,
        decision: t.decision,
      }),
    ),
  });

  // Проверка эскалации
  if (result.shouldEscalate) {
    logger.warn("Interview escalation triggered", {
      chatSessionId: context.chatSessionId,
      reason: result.escalationReason,
    });

    return {
      analysis: result.analysis,
      shouldContinue: false,
      shouldEscalate: true,
      escalationReason: result.escalationReason,
      reason: result.reason,
    };
  }

  // Возвращаем результат
  return {
    analysis: result.analysis,
    shouldContinue: result.shouldContinue,
    reason: result.reason,
    nextQuestion: result.nextQuestion,
    waitingForCandidateResponse: result.waitingForCandidateResponse,
    isSimpleAcknowledgment: result.isSimpleAcknowledgment,
  };
}

/**
 * Gets interview context from database
 */
export async function getInterviewContext(
  interviewSessionId: string,
): Promise<InterviewContext | null> {
  type MessageType = {
    role: string;
    content: string | null;
    type?: string;
    voiceTranscription?: string | null;
    createdAt: Date;
  };

  type SessionType = {
    id: string;
    responseId: string;
    metadata: Record<string, unknown> | null;
    messages: MessageType[];
  };

  const session = (await db.query.interviewSession.findFirst({
    where: eq(interviewSession.id, interviewSessionId),
    with: {
      messages: {
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
      },
    },
  })) as SessionType | undefined;

  if (!session) {
    return null;
  }

  const metadata = parseMetadata(session.metadata);
  const questionAnswers = metadata.questionAnswers ?? [];

  // Формируем историю диалога с правильными типами
  const conversationHistory = session.messages
    .filter((msg) => msg.role === "user" || msg.role === "assistant")
    .map((msg) => ({
      sender: msg.role as "user" | "assistant",
      content:
        msg.type === "voice" && msg.voiceTranscription
          ? msg.voiceTranscription
          : msg.content || "",
      contentType: (msg.type === "text" || msg.type === "voice"
        ? msg.type
        : undefined) as "text" | "voice" | undefined,
      timestamp: msg.createdAt,
    }));

  // Получаем response по responseId из session
  const responseRecord = await db.query.response.findFirst({
    where: (r, { eq }) => eq(r.id, session.responseId),
  });

  if (!responseRecord) {
    return null;
  }

  let candidateName: string | null = null;
  let vacancyTitle: string | null = null;
  let vacancyDescription: string | null = null;
  const responseId: string | null = session.responseId;
  const gigResponseId: string | null = null;
  let resumeLanguage: string | null = "ru";
  let botSettings: InterviewContext["botSettings"] | undefined;
  let customBotInstructions: string | null = null;
  let customOrganizationalQuestions: string | null = null;
  let customInterviewQuestions: string | null = null;
  let interviewMediaFiles: InterviewContext["interviewMediaFiles"] | undefined;

  candidateName = responseRecord.candidateName;
  resumeLanguage = responseRecord.resumeLanguage || "ru";

  // Загружаем vacancy или gig в зависимости от entityType
  if (responseRecord.entityType === "gig") {
    const gig = await db.query.gig.findFirst({
      where: (g, { eq }) => eq(g.id, responseRecord.entityId),
      columns: {
        id: true,
        title: true,
        description: true,
        customBotInstructions: true,
        customOrganizationalQuestions: true,
        customInterviewQuestions: true,
      },
      with: {
        workspace: {
          with: {
            botSettings: true,
          },
        },
      },
    });

    if (gig) {
      vacancyTitle = gig.title || null;
      vacancyDescription = gig.description
        ? stripHtml(gig.description).result
        : null;
      customBotInstructions = gig.customBotInstructions || null;
      customOrganizationalQuestions = gig.customOrganizationalQuestions || null;
      customInterviewQuestions = gig.customInterviewQuestions || null;

      const workspace = gig.workspace;
      if (workspace?.botSettings) {
        botSettings = {
          botName: workspace.botSettings.botName || undefined,
          botRole: workspace.botSettings.botRole || undefined,
          companyName: workspace.botSettings.companyName,
          companyDescription:
            workspace.botSettings.companyDescription || undefined,
        };
      }

      // Получаем медиафайлы для gig
      const gigId = gig.id;

      const mediaRecords = await db.query.gigInterviewMedia.findMany({
        where: (media, { eq }) => eq(media.gigId, gigId),
        with: {
          file: true,
        },
      });

      interviewMediaFiles = await Promise.all(
        mediaRecords.map(async (record) => {
          try {
            const url = await getDownloadUrl(record.file.key);
            return {
              id: record.file.id,
              fileName: record.file.fileName,
              mimeType: record.file.mimeType,
              url,
            };
          } catch {
            return null;
          }
        }),
      ).then((results) =>
        results.filter((f): f is NonNullable<typeof f> => f !== null),
      );

      if (interviewMediaFiles && interviewMediaFiles.length === 0) {
        interviewMediaFiles = undefined;
      }
    }
  } else if (responseRecord.entityType === "vacancy") {
    const vacancy = await db.query.vacancy.findFirst({
      where: (v, { eq }) => eq(v.id, responseRecord.entityId),
      columns: {
        title: true,
        description: true,
        customBotInstructions: true,
        customOrganizationalQuestions: true,
        customInterviewQuestions: true,
      },
      with: {
        workspace: {
          with: {
            botSettings: true,
          },
        },
      },
    });

    if (vacancy) {
      vacancyTitle = vacancy.title || null;
      vacancyDescription = vacancy.description
        ? stripHtml(vacancy.description).result
        : null;
      customBotInstructions = vacancy.customBotInstructions || null;
      customOrganizationalQuestions =
        vacancy.customOrganizationalQuestions || null;
      customInterviewQuestions = vacancy.customInterviewQuestions || null;

      const workspace = vacancy.workspace;
      if (workspace?.botSettings) {
        botSettings = {
          botName: workspace.botSettings.botName || undefined,
          botRole: workspace.botSettings.botRole || undefined,
          companyName: workspace.botSettings.companyName,
          companyDescription:
            workspace.botSettings.companyDescription || undefined,
        };
      }
    }
  }

  return {
    chatSessionId: session.id,
    candidateName,
    vacancyTitle,
    vacancyDescription,
    questionNumber: questionAnswers.length + 1,
    responseId,
    gigResponseId,
    resumeLanguage,
    conversationHistory,
    botSettings,
    customBotInstructions,
    customOrganizationalQuestions,
    customInterviewQuestions,
    interviewMediaFiles,
  };
}

/**
 * Saves question and answer to interviewSession metadata
 */
export async function saveQuestionAnswer(
  interviewSessionId: string,
  question: string,
  answer: string,
) {
  // Получаем текущие метаданные
  const metadata = await getInterviewSessionMetadata(interviewSessionId);
  const questionAnswers = metadata.questionAnswers ?? [];

  // Добавляем новую пару вопрос-ответ
  questionAnswers.push({ question, answer });

  // Обновляем метаданные с использованием оптимистической блокировки
  const success = await updateInterviewSessionMetadata(interviewSessionId, {
    questionAnswers,
  });

  if (!success) {
    throw new Error(
      `Failed to save question-answer for interviewSession ${interviewSessionId} after multiple retries`,
    );
  }
}

/**
 * Результат скоринга интервью
 */
export interface InterviewScoringResult {
  score: number; // 1-5 scale
  detailedScore: number; // 0-100 scale
  analysis: string;
  botUsageDetected: number; // 0-100 scale
}

/**
 * Creates final scoring based on entire interview
 */
export async function createInterviewScoring(
  context: InterviewContext,
): Promise<InterviewScoringResult> {
  const { candidateName, vacancyTitle, vacancyDescription } = context;

  // Создаем агента
  const model = createAgentModel();
  const factory = new AgentFactory({
    model,
  });
  const agent = factory.createInterviewScoring();

  // Проверяем наличие истории диалога
  if (
    !context.conversationHistory ||
    context.conversationHistory.length === 0
  ) {
    logger.warn("Interview scoring called without conversation history", {
      chatSessionId: context.chatSessionId,
    });

    return {
      score: INTERVIEW.DEFAULT_FALLBACK_SCORE,
      detailedScore: INTERVIEW.DEFAULT_FALLBACK_DETAILED_SCORE,
      analysis: "Невозможно оценить интервью без истории диалога",
      botUsageDetected: 0,
    };
  }

  // Формируем контекст для агента (конвертируем роли для совместимости с AI)
  const agentContext = {
    candidateName: candidateName ?? undefined,
    vacancyTitle: vacancyTitle ?? undefined,
    vacancyDescription: vacancyDescription ?? undefined,
    conversationHistory: (context.conversationHistory || []).map((msg) => ({
      sender:
        msg.sender === "user" ? "CANDIDATE" : ("BOT" as "CANDIDATE" | "BOT"),
      content: msg.content,
      contentType: msg.contentType
        ? ((msg.contentType === "text" ? "TEXT" : "VOICE") as "TEXT" | "VOICE")
        : undefined,
      timestamp: msg.timestamp,
    })),
  };

  // Выполняем агента
  const result = await agent.execute({}, agentContext);

  // Обработка ошибки
  if (!result.success || !result.data) {
    logger.error("Interview scoring agent failed", {
      error: result.error,
      chatSessionId: context.chatSessionId,
    });

    return {
      score: INTERVIEW.DEFAULT_FALLBACK_SCORE,
      detailedScore: INTERVIEW.DEFAULT_FALLBACK_DETAILED_SCORE,
      analysis: "Failed to analyze interview automatically",
      botUsageDetected: 0,
    };
  }

  // Возвращаем результат
  return {
    score: result.data.score,
    detailedScore: result.data.detailedScore,
    analysis: result.data.analysis,
    botUsageDetected: result.data.botUsageDetected,
  };
}
