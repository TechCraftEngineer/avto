/**
 * Инструменты для агентов на базе AI SDK 6
 *
 * Эти инструменты предоставляют AI возможность анализировать контекст
 * и принимать решения на основе данных
 */

import { generateObject } from "@qbs-autonaim/lib/ai";
import { z } from "zod";

/**
 * Схема для сообщения в истории
 */
export const messageSchema: z.ZodType<{
  sender: "CANDIDATE" | "BOT";
  content?: string;
  contentType?: "TEXT" | "VOICE";
}> = z.object({
  sender: z
    .enum(["CANDIDATE", "BOT"] as const)
    .describe("Отправитель: CANDIDATE или BOT"),
  content: z.string().optional(),
  contentType: z
    .enum(["TEXT", "VOICE"] as const)
    .optional()
    .describe("Тип контента: TEXT или VOICE"),
});

type MessageSchema = typeof messageSchema;
type Message = z.infer<typeof messageSchema>;

/**
 * Инструмент для получения информации о голосовых сообщениях
 * AI использует это для принятия решений о запросе голосовых
 */
export const getVoiceMessagesInfo = {
  description:
    "Получает информацию о количестве голосовых сообщений от кандидата в истории диалога",
  inputSchema: z.object({
    history: z.array(messageSchema).describe("История сообщений диалога"),
  }),
  execute: async ({
    history,
  }: {
    history: Message[];
  }): Promise<{ count: number; hasEnough: boolean; description: string }> => {
    const voiceMessages = history.filter(
      (msg) => msg.sender === "CANDIDATE" && msg.contentType === "VOICE",
    );

    return {
      count: voiceMessages.length,
      hasEnough: voiceMessages.length >= 2,
      description: `Кандидат отправил ${voiceMessages.length} голосовых сообщений`,
    };
  },
};

/**
 * Инструмент для получения контекста диалога
 * AI использует это для понимания истории общения
 */
export const getConversationContext: {
  description: string;
  inputSchema: z.ZodObject<{
    history: z.ZodArray<MessageSchema>;
  }>;
  execute: (args: { history: Message[] }) => Promise<{
    totalMessages: number;
    candidateMessages: number;
    botMessages: number;
    voiceMessages: number;
    lastCandidateMessage: string | undefined;
    conversationLength: number;
  }>;
} = {
  description: "Получает контекст и статистику текущего диалога с кандидатом",
  inputSchema: z.object({
    history: z.array(messageSchema).describe("История сообщений"),
  }),
  execute: async ({
    history,
  }: {
    history: Message[];
  }): Promise<{
    totalMessages: number;
    candidateMessages: number;
    botMessages: number;
    voiceMessages: number;
    lastCandidateMessage: string | undefined;
    conversationLength: number;
  }> => {
    const candidateMessages = history.filter((m) => m.sender === "CANDIDATE");
    const botMessages = history.filter((m) => m.sender === "BOT");
    const voiceCount = history.filter(
      (m) => m.sender === "CANDIDATE" && m.contentType === "VOICE",
    ).length;

    return {
      totalMessages: history.length,
      candidateMessages: candidateMessages.length,
      botMessages: botMessages.length,
      voiceMessages: voiceCount,
      lastCandidateMessage:
        candidateMessages[candidateMessages.length - 1]?.content,
      conversationLength: history.length,
    };
  },
};

/**
 * Инструмент для анализа эмоционального тона текста
 */
export const analyzeEmotionalTone = {
  description: "Анализирует эмоциональный тон текста кандидата",
  inputSchema: z.object({
    text: z.string().describe("Текст для анализа"),
    context: z.enum(["resume", "application", "interview"] as const).describe("Контекст текста"),
  }),
  execute: async ({
    text,
    context,
  }: {
    text: string;
    context: "resume" | "application" | "interview";
  }): Promise<{
    enthusiasm: number;
    confidence: number;
    stressLevel: number;
    authenticity: number;
    reasoning: string;
  }> => {
    const result = await generateObject({
      schema: z.object({
        enthusiasm: z.number().min(0).max(100),
        confidence: z.number().min(0).max(100),
        stressLevel: z.number().min(0).max(100),
        authenticity: z.number().min(0).max(100),
        reasoning: z.string(),
      }),
      prompt: `Проанализируй эмоциональный тон следующего текста кандидата в контексте ${context}:

Текст: "${text}"

Оцени по шкале 0-100:
- enthusiasm (энтузиазм): уровень энтузиазма и позитивного отношения
- confidence (уверенность): уровень уверенности в себе и своих навыках
- stressLevel (стресс): уровень стресса или неуверенности
- authenticity (аутентичность): насколько текст кажется искренним и не шаблонным

Предоставь reasoning с объяснением оценки.`,
      generationName: "analyze-emotional-tone",
    });

    return result.object;
  },
};

/**
 * Инструмент для анализа карьерной стабильности
 */
export const analyzeCareerStability = {
  description: "Анализирует карьерную стабильность кандидата на основе опыта работы",
  inputSchema: z.object({
    experience: z.array(z.object({
      company: z.string(),
      position: z.string(),
      startDate: z.string(),
      endDate: z.string().optional(),
      reasonForLeaving: z.string().optional(),
    })).describe("Опыт работы кандидата"),
  }),
  execute: async ({
    experience,
  }: {
    experience: Array<{
      company: string;
      position: string;
      startDate: string;
      endDate?: string;
      reasonForLeaving?: string;
    }>;
  }): Promise<{
    averageTenure: number;
    growthRate: number;
    riskFactors: string[];
    score: number;
  }> => {
    const result = await generateObject({
      schema: z.object({
        averageTenure: z.number(),
        growthRate: z.number().min(0).max(100),
        riskFactors: z.array(z.string()),
        score: z.number().min(0).max(100),
      }),
      prompt: `Проанализируй карьерную стабильность кандидата на основе его опыта работы:

Опыт работы:
${experience.map(exp => `- ${exp.position} в ${exp.company} (${exp.startDate} - ${exp.endDate || 'настоящее время'})${exp.reasonForLeaving ? `, причина ухода: ${exp.reasonForLeaving}` : ''}`).join('\n')}

Оцени:
- averageTenure: средняя продолжительность работы в месяцах
- growthRate: скорость карьерного роста (0-100%)
- riskFactors: массив факторов риска (например, "Частая смена работы", "Увольнения по инициативе работодателя")
- score: общий балл стабильности (0-100, где 100 - очень стабильный кандидат)`,
      generationName: "analyze-career-stability",
    });

    return result.object;
  },
};

/**
 * Инструмент для предиктивного моделирования
 */
export const runPredictiveModel = {
  description: "Предсказывает метрики успеха кандидата на основе комплексных данных",
  inputSchema: z.object({
    candidateData: z.object({
      experience: z.array(z.object({
        company: z.string(),
        position: z.string(),
        startDate: z.string(),
        endDate: z.string().optional(),
        reasonForLeaving: z.string().optional(),
      })),
      skills: z.array(z.object({
        name: z.string(),
        level: z.number().min(0).max(100).optional(),
        category: z.string().optional(),
      })),
      interviewPerformance: z.object({
        technicalScore: z.number().min(0).max(100).optional(),
        communicationScore: z.number().min(0).max(100).optional(),
        problemSolvingScore: z.number().min(0).max(100).optional(),
        overallScore: z.number().min(0).max(100).optional(),
      }),
      behavioralData: z.object({
        adaptability: z.number().min(0).max(100).optional(),
        teamwork: z.number().min(0).max(100).optional(),
        leadership: z.number().min(0).max(100).optional(),
        initiative: z.number().min(0).max(100).optional(),
      }),
    }).describe("Комплексные данные о кандидате"),
  }),
  execute: async ({
    candidateData,
  }: {
    candidateData: {
      experience: Array<{
        company: string;
        position: string;
        startDate: string;
        endDate?: string;
        reasonForLeaving?: string;
      }>;
      skills: Array<{
        name: string;
        level?: number;
        category?: string;
      }>;
      interviewPerformance: {
        technicalScore?: number;
        communicationScore?: number;
        problemSolvingScore?: number;
        overallScore?: number;
      };
      behavioralData: {
        adaptability?: number;
        teamwork?: number;
        leadership?: number;
        initiative?: number;
      };
    };
  }): Promise<{
    retention: number;
    performance: number;
    cultureFit: number;
    growth: number;
  }> => {
    const result = await generateObject({
      schema: z.object({
        retention: z.number().min(0).max(100),
        performance: z.number().min(0).max(100),
        cultureFit: z.number().min(0).max(100),
        growth: z.number().min(0).max(100),
      }),
      prompt: `На основе следующих данных о кандидате предскажи метрики его успеха в компании:

Опыт работы: ${JSON.stringify(candidateData.experience)}
Навыки: ${JSON.stringify(candidateData.skills)}
Производительность на интервью: ${JSON.stringify(candidateData.interviewPerformance)}
Поведенческие данные: ${JSON.stringify(candidateData.behavioralData)}

Оцени по шкале 0-100:
- retention: вероятность удержания кандидата в компании
- performance: ожидаемая производительность
- cultureFit: соответствие корпоративной культуре
- growth: потенциал роста и развития`,
      generationName: "run-predictive-model",
    });

    return result.object;
  },
};

/**
 * Инструмент для оценки способности к обучению
 */
export const assessLearningAgility = {
  description: "Оценивает способность кандидата к обучению на основе ответов в интервью",
  inputSchema: z.object({
    responses: z.array(z.object({
      question: z.string(),
      answer: z.string(),
      context: z.string(),
    })).describe("Ответы кандидата на вопросы интервью"),
  }),
  execute: async ({
    responses,
  }: {
    responses: Array<{
      question: string;
      answer: string;
      context: string;
    }>;
  }): Promise<{
    adaptability: number;
    curiosity: number;
    growthMindset: number;
    score: number;
  }> => {
    const result = await generateObject({
      schema: z.object({
        adaptability: z.number().min(0).max(100),
        curiosity: z.number().min(0).max(100),
        growthMindset: z.number().min(0).max(100),
        score: z.number().min(0).max(100),
      }),
      prompt: `Оцени способность кандидата к обучению на основе следующих ответов в интервью:

${responses.map(r => `Вопрос: ${r.question}\nОтвет: ${r.answer}\nКонтекст: ${r.context}\n`).join('\n')}

Оцени по шкале 0-100:
- adaptability: способность адаптироваться к изменениям и новым технологиям
- curiosity: уровень любопытства и желания учиться
- growthMindset: ориентация на рост и развитие
- score: общий балл способности к обучению`,
      generationName: "assess-learning-agility",
    });

    return result.object;
  },
};

/**
 * Инструмент для проверки background кандидата
 */
export const performBackgroundCheck = {
  description: "Проверяет background кандидата на предмет рисков",
  inputSchema: z.object({
    candidateInfo: z.object({
      name: z.string(),
      email: z.string(),
      phone: z.string(),
      previousCompanies: z.array(z.string()),
    }).describe("Информация о кандидате для проверки"),
  }),
  execute: async ({
    candidateInfo,
  }: {
    candidateInfo: {
      name: string;
      email: string;
      phone: string;
      previousCompanies: string[];
    };
  }): Promise<{
    status: string;
    redFlags: string[];
    recommendations: string[];
  }> => {
    // Redact PII before sending to AI
    const redactedCandidateInfo = {
      ...candidateInfo,
      name: "<NAME_REDACTED>",
      email: "<EMAIL_REDACTED>",
      phone: "<PHONE_REDACTED>",
    };

    const result = await generateObject({
      schema: z.object({
        status: z.string(),
        redFlags: z.array(z.string()),
        recommendations: z.array(z.string()),
      }),
      prompt: `Проведи background check кандидата на основе следующих данных:

Имя: ${redactedCandidateInfo.name}
Email: ${redactedCandidateInfo.email}
Телефон: ${redactedCandidateInfo.phone}
Предыдущие компании: ${redactedCandidateInfo.previousCompanies.join(', ')}

Проверь на потенциальные риски и проблемы. Определи статус (PASSED или FLAGGED), перечисли redFlags (красные флаги) и дай рекомендации.`,
      generationName: "perform-background-check",
    });

    return result.object;
  },
};
