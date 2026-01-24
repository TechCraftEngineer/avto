/**
 * Инструменты для агентов на базе AI SDK 6
 *
 * Эти инструменты предоставляют AI возможность анализировать контекст
 * и принимать решения на основе данных
 */

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
export const getVoiceMessagesInfo: {
  description: string;
  inputSchema: z.ZodObject<{
    history: z.ZodArray<MessageSchema>;
  }>;
  execute: (args: {
    history: Message[];
  }) => Promise<{ count: number; hasEnough: boolean; description: string }>;
} = {
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
export const analyzeEmotionalTone: {
  description: string;
  inputSchema: z.ZodObject<{
    text: z.ZodString;
    context: z.ZodEnum<["resume", "application", "interview"]>;
  }>;
  execute: (args: {
    text: string;
    context: "resume" | "application" | "interview";
  }) => Promise<{
    enthusiasm: number;
    confidence: number;
    stressLevel: number;
    authenticity: number;
    reasoning: string;
  }>;
} = {
  description: "Анализирует эмоциональный тон текста кандидата",
  inputSchema: z.object({
    text: z.string().describe("Текст для анализа"),
    context: z.enum(["resume", "application", "interview"]).describe("Контекст текста"),
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
    // Простая эвристическая оценка - в реальности здесь будет AI анализ
    const enthusiasm = Math.min(100, Math.max(0, (text.match(/!/g) || []).length * 10 + (text.match(/\b(готов|рад|интересно|в восторге)\b/gi) || []).length * 15));
    const confidence = Math.min(100, Math.max(0, (text.match(/\b(уверен|опыт|знаю|умею)\b/gi) || []).length * 20));
    const stressLevel = Math.min(100, Math.max(0, (text.match(/\b(сложно|проблема|трудно|не уверен)\b/gi) || []).length * 25));
    const authenticity = Math.min(100, Math.max(0, 100 - (text.match(/\b(идеальный|лучший|топ|профессионал)\b/gi) || []).length * 30));

    return {
      enthusiasm,
      confidence,
      stressLevel,
      authenticity,
      reasoning: `Анализ текста в контексте ${context}: выявлен уровень энтузиазма ${enthusiasm}%, уверенности ${confidence}%, стресса ${stressLevel}%, аутентичности ${authenticity}%`,
    };
  },
};

/**
 * Инструмент для анализа карьерной стабильности
 */
export const analyzeCareerStability: {
  description: string;
  inputSchema: z.ZodObject<{
    experience: z.ZodArray<z.ZodObject<{
      company: z.ZodString;
      position: z.ZodString;
      startDate: z.ZodString;
      endDate: z.ZodString.optional;
      reasonForLeaving: z.ZodString.optional;
    }>>;
  }>;
  execute: (args: {
    experience: Array<{
      company: string;
      position: string;
      startDate: string;
      endDate?: string;
      reasonForLeaving?: string;
    }>;
  }) => Promise<{
    averageTenure: number;
    growthRate: number;
    riskFactors: string[];
    score: number;
  }>;
} = {
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
    if (experience.length === 0) {
      return {
        averageTenure: 0,
        growthRate: 0,
        riskFactors: ["Нет опыта работы"],
        score: 0,
      };
    }

    // Расчет средней продолжительности работы
    const tenures = experience.map(exp => {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)); // месяцы
    });

    const averageTenure = tenures.reduce((sum, tenure) => sum + tenure, 0) / tenures.length;

    // Расчет скорости роста
    const positions = experience.map(exp => exp.position.toLowerCase());
    const growthIndicators = positions.filter(pos =>
      /\b(lead|senior|principal|head|director|manager)\b/.test(pos)
    ).length;
    const growthRate = (growthIndicators / experience.length) * 100;

    // Факторы риска
    const riskFactors: string[] = [];
    if (averageTenure < 6) riskFactors.push("Частая смена работы");
    if (experience.some(exp => exp.reasonForLeaving?.toLowerCase().includes("уволен"))) {
      riskFactors.push("Увольнения по инициативе работодателя");
    }
    if (experience.length > 5 && averageTenure < 12) riskFactors.push("Отсутствие долгосрочных проектов");

    // Общий скор
    let score = 50; // базовый
    score += Math.min(30, averageTenure * 2); // до +30 за стабильность
    score += Math.min(20, growthRate); // до +20 за рост
    score -= riskFactors.length * 15; // -15 за каждый фактор риска

    return {
      averageTenure: Math.round(averageTenure * 10) / 10,
      growthRate: Math.round(growthRate),
      riskFactors,
      score: Math.max(0, Math.min(100, Math.round(score))),
    };
  },
};

/**
 * Инструмент для предиктивного моделирования
 */
export const runPredictiveModel: {
  description: string;
  inputSchema: z.ZodObject<{
    candidateData: z.ZodObject<{
      experience: z.ZodAny;
      skills: z.ZodAny;
      interviewPerformance: z.ZodAny;
      behavioralData: z.ZodAny;
    }>;
  }>;
  execute: (args: {
    candidateData: {
      experience: any;
      skills: any;
      interviewPerformance: any;
      behavioralData: any;
    };
  }) => Promise<{
    retention: number;
    performance: number;
    cultureFit: number;
    growth: number;
  }>;
} = {
  description: "Предсказывает метрики успеха кандидата на основе комплексных данных",
  inputSchema: z.object({
    candidateData: z.object({
      experience: z.any(),
      skills: z.any(),
      interviewPerformance: z.any(),
      behavioralData: z.any(),
    }).describe("Комплексные данные о кандидате"),
  }),
  execute: async ({
    candidateData,
  }: {
    candidateData: {
      experience: any;
      skills: any;
      interviewPerformance: any;
      behavioralData: any;
    };
  }): Promise<{
    retention: number;
    performance: number;
    cultureFit: number;
    growth: number;
  }> => {
    // Простая модель на основе эвристик - в реальности ML модель
    const experience = candidateData.experience || {};
    const skills = candidateData.skills || [];
    const interview = candidateData.interviewPerformance || {};
    const behavioral = candidateData.behavioralData || {};

    // Retention probability (вероятность удержания)
    let retention = 60; // базовый
    if (experience.averageTenure > 24) retention += 20; // стабильные кандидаты
    if (interview.communication > 70) retention += 10; // хорошая коммуникация
    if (behavioral.consistency > 80) retention += 10; // consistent поведение

    // Performance score (предсказанная производительность)
    let performance = 65; // базовый
    performance += Math.min(20, skills.length * 2); // навыки
    performance += Math.min(15, (interview.technical || 0) / 10); // технические навыки

    // Cultural fit (соответствие культуре)
    let cultureFit = 70; // базовый
    if (interview.motivation > 75) cultureFit += 15;
    if (behavioral.formality > 60 && behavioral.formality < 90) cultureFit += 10; // баланс формальности

    // Growth potential (потенциал роста)
    let growth = 55; // базовый
    if (interview.learningAgility > 70) growth += 25;
    if (experience.growthRate > 30) growth += 20;

    return {
      retention: Math.max(0, Math.min(100, Math.round(retention))),
      performance: Math.max(0, Math.min(100, Math.round(performance))),
      cultureFit: Math.max(0, Math.min(100, Math.round(cultureFit))),
      growth: Math.max(0, Math.min(100, Math.round(growth))),
    };
  },
};

/**
 * Инструмент для оценки способности к обучению
 */
export const assessLearningAgility: {
  description: string;
  inputSchema: z.ZodObject<{
    responses: z.ZodArray<z.ZodObject<{
      question: z.ZodString;
      answer: z.ZodString;
      context: z.ZodString;
    }>>;
  }>;
  execute: (args: {
    responses: Array<{
      question: string;
      answer: string;
      context: string;
    }>;
  }) => Promise<{
    adaptability: number;
    curiosity: number;
    growthMindset: number;
    score: number;
  }>;
} = {
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
    let adaptability = 0;
    let curiosity = 0;
    let growthMindset = 0;

    for (const response of responses) {
      const answer = response.answer.toLowerCase();

      // Адаптивность: упоминание новых технологий, изменения
      if (/\b(адаптир|приспособ|измен|новые технологии|обучил)\b/.test(answer)) {
        adaptability += 20;
      }

      // Любопытство: вопросы, интерес к обучению
      if (/\b(интерес|хочу узнать|готов изуч|любопыт|вопрос)\b/.test(answer)) {
        curiosity += 25;
      }

      // Growth mindset: фокус на развитии, а не на текущих навыках
      if (/\b(развива|улучш|навык|обучен|развитие)\b/.test(answer)) {
        growthMindset += 15;
      }
      if (/\b(не знаю|могу науч|хочу науч)\b/.test(answer)) {
        growthMindset += 20;
      }
    }

    // Нормализация до 0-100
    adaptability = Math.min(100, adaptability);
    curiosity = Math.min(100, curiosity);
    growthMindset = Math.min(100, growthMindset);

    const score = Math.round((adaptability + curiosity + growthMindset) / 3);

    return {
      adaptability,
      curiosity,
      growthMindset,
      score,
    };
  },
};

/**
 * Инструмент для проверки background кандидата
 */
export const performBackgroundCheck: {
  description: string;
  inputSchema: z.ZodObject<{
    candidateInfo: z.ZodObject<{
      name: z.ZodString;
      email: z.ZodString;
      phone: z.ZodString;
      previousCompanies: z.ZodArray<z.ZodString>;
    }>;
  }>;
  execute: (args: {
    candidateInfo: {
      name: string;
      email: string;
      phone: string;
      previousCompanies: string[];
    };
  }) => Promise<{
    status: string;
    redFlags: string[];
    recommendations: string[];
  }>;
} = {
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
    const redFlags: string[] = [];
    const recommendations: string[] = [];

    // Проверка email на валидность
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(candidateInfo.email)) {
      redFlags.push("Невалидный email адрес");
    }

    // Проверка телефона (простая)
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(candidateInfo.phone)) {
      redFlags.push("Подозрительный формат телефона");
    }

    // Проверка компаний (имитация проверки на санкционные списки)
    const suspiciousCompanies = ["problematic-corp", "bad-company"];
    const hasSuspiciousCompany = candidateInfo.previousCompanies.some(company =>
      suspiciousCompanies.some(suspicious =>
        company.toLowerCase().includes(suspicious)
      )
    );

    if (hasSuspiciousCompany) {
      redFlags.push("Работа в компаниях с негативной репутацией");
    }

    // Рекомендации
    if (redFlags.length === 0) {
      recommendations.push("Background check пройден успешно");
    } else {
      recommendations.push("Рекомендуется дополнительная проверка");
      recommendations.push("Провести reference check с предыдущими работодателями");
    }

    const status = redFlags.length === 0 ? "PASSED" : "FLAGGED";

    return {
      status,
      redFlags,
      recommendations,
    };
  },
};
