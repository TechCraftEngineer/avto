/**
 * Конфигурация промпта для gig заданий
 */

import type { PromptConfig } from "../types";

interface GigMainContext {
  id: string;
  title: string;
  description: string | null;
  requirements: {
    title: string;
    summary: string;
    deliverables: string[];
    required_skills: string[];
    nice_to_have_skills: string[];
    tech_stack: string[];
    experience_level: string;
    languages: Array<{
      language: string;
      level: string;
    }>;
    keywords_for_matching: string[];
  } | null;
  type: string;
  budgetMin: number | null;
  budgetMax: number | null;

  deadline: Date | null;
  estimatedDuration: string | null;
  customBotInstructions: string | null;
}

interface CandidateData {
  id: string;
  candidateId: string;
  candidateName: string | null;
  proposedPrice: number | null;

  proposedDeliveryDays: number | null;
  coverLetter: string | null;
  skills: string[] | null;
  rating: string | null;
  status: string;
  hrSelectionStatus: string | null;
  compositeScore: number | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  recommendation: string | null;
  screeningScore: number | null;
  screeningDetailedScore: number | null;
  screeningAnalysis: string | null;
  interviewScore: number | null;
  interviewDetailedScore: number | null;
  interviewAnalysis: string | null;
}

function formatGigMain(ctx: Record<string, unknown>): string {
  const gig = ctx as unknown as GigMainContext;
  const parts: string[] = [];

  parts.push(`# Информация о задании`);
  parts.push(`**Название:** ${gig.title}`);

  if (gig.description) {
    parts.push(`**Описание:** ${gig.description}`);
  }

  parts.push(`**Тип:** ${gig.type}`);

  if (gig.budgetMin !== null || gig.budgetMax !== null) {
    if (gig.budgetMin !== null && gig.budgetMax !== null) {
      parts.push(`**Бюджет:** ${gig.budgetMin}-${gig.budgetMax} ₽`);
    } else if (gig.budgetMin !== null) {
      parts.push(`**Бюджет:** от ${gig.budgetMin} ₽`);
    } else if (gig.budgetMax !== null) {
      parts.push(`**Бюджет:** до ${gig.budgetMax} ₽`);
    }
  }

  if (gig.deadline) {
    parts.push(`**Дедлайн:** ${gig.deadline.toLocaleDateString("ru-RU")}`);
  }

  if (gig.estimatedDuration) {
    parts.push(`**Ожидаемая длительность:** ${gig.estimatedDuration}`);
  }

  if (gig.requirements) {
    const req = gig.requirements;
    parts.push(`\n## Требования к кандидату`);

    if (req.summary) {
      parts.push(`**Краткое описание:** ${req.summary}`);
    }

    if (req.required_skills && req.required_skills.length > 0) {
      parts.push(`**Обязательные навыки:** ${req.required_skills.join(", ")}`);
    }

    if (req.nice_to_have_skills && req.nice_to_have_skills.length > 0) {
      parts.push(
        `**Желательные навыки:** ${req.nice_to_have_skills.join(", ")}`,
      );
    }

    if (req.tech_stack && req.tech_stack.length > 0) {
      parts.push(`**Технологии:** ${req.tech_stack.join(", ")}`);
    }

    if (req.experience_level) {
      parts.push(`**Уровень опыта:** ${req.experience_level}`);
    }

    if (req.languages && req.languages.length > 0) {
      const langs = req.languages
        .map((l) => `${l.language} (${l.level})`)
        .join(", ");
      parts.push(`**Языки:** ${langs}`);
    }

    if (req.deliverables && req.deliverables.length > 0) {
      parts.push(`**Ожидаемые результаты:**`);
      for (const deliverable of req.deliverables) {
        parts.push(`- ${deliverable}`);
      }
    }
  }

  if (gig.customBotInstructions) {
    parts.push(`\n## Дополнительные инструкции`);
    parts.push(gig.customBotInstructions);
  }

  return parts.join("\n");
}

function formatCandidate(candidate: CandidateData): string {
  const parts: string[] = [];

  const name =
    candidate.candidateName || `Кандидат ${candidate.id.slice(0, 8)}`;
  parts.push(`### ${name}`);

  if (candidate.proposedPrice !== null) {
    parts.push(`- **Цена:** ${candidate.proposedPrice} ₽`);
  } else {
    parts.push(`- **Цена:** не указана`);
  }

  if (candidate.proposedDeliveryDays !== null) {
    parts.push(`- **Сроки:** ${candidate.proposedDeliveryDays} дней`);
  } else {
    parts.push(`- **Сроки:** не указаны`);
  }

  parts.push(`- **Статус:** ${candidate.status}`);

  if (candidate.hrSelectionStatus) {
    parts.push(`- **HR статус:** ${candidate.hrSelectionStatus}`);
  }

  if (candidate.screeningDetailedScore !== null) {
    parts.push(
      `- **Screening оценка:** ${candidate.screeningDetailedScore}/100`,
    );
  }

  if (candidate.interviewDetailedScore !== null) {
    parts.push(
      `- **Interview оценка:** ${candidate.interviewDetailedScore}/100`,
    );
  }

  if (candidate.compositeScore !== null) {
    parts.push(`- **Общая оценка:** ${candidate.compositeScore}/100`);
  }

  if (candidate.recommendation) {
    parts.push(`- **Рекомендация:** ${candidate.recommendation}`);
  }

  if (candidate.strengths && candidate.strengths.length > 0) {
    parts.push(`- **Сильные стороны:** ${candidate.strengths.join(", ")}`);
  }

  if (candidate.weaknesses && candidate.weaknesses.length > 0) {
    parts.push(`- **Слабые стороны:** ${candidate.weaknesses.join(", ")}`);
  }

  if (candidate.skills && candidate.skills.length > 0) {
    parts.push(`- **Навыки:** ${candidate.skills.join(", ")}`);
  }

  if (candidate.coverLetter) {
    const shortLetter =
      candidate.coverLetter.length > 200
        ? `${candidate.coverLetter.slice(0, 200)}...`
        : candidate.coverLetter;
    parts.push(`- **Сопроводительное письмо:** ${shortLetter}`);
  }

  if (candidate.screeningAnalysis) {
    const shortAnalysis =
      candidate.screeningAnalysis.length > 300
        ? `${candidate.screeningAnalysis.slice(0, 300)}...`
        : candidate.screeningAnalysis;
    parts.push(`- **Анализ screening:** ${shortAnalysis}`);
  }

  if (candidate.interviewAnalysis) {
    const shortAnalysis =
      candidate.interviewAnalysis.length > 300
        ? `${candidate.interviewAnalysis.slice(0, 300)}...`
        : candidate.interviewAnalysis;
    parts.push(`- **Анализ interview:** ${shortAnalysis}`);
  }

  return parts.join("\n");
}

function formatGigRelated(ctx: Record<string, unknown>): string {
  const { candidates } = ctx as { candidates: CandidateData[] };
  const parts: string[] = [];

  if (candidates.length === 0) {
    parts.push(`\n**⚠️ ВАЖНО:** На данный момент нет откликов на это задание.`);
    parts.push(
      `\n**Рекомендации для пользователя:**\n- Проверьте, опубликовано ли задание\n- Убедитесь, что требования и бюджет привлекательны для исполнителей\n- Рассмотрите возможность расширить поиск или скорректировать условия\n- Дождитесь появления откликов, прежде чем проводить анализ`,
    );
    return parts.join("\n");
  }

  if (candidates.length > 50) {
    parts.push(
      `\n**Примечание:** Из-за большого количества кандидатов (${candidates.length}) показана только агрегированная статистика. Для детального анализа конкретных кандидатов задавайте уточняющие вопросы.`,
    );
    return parts.join("\n");
  }

  if (candidates.length > 20) {
    parts.push(`\n# Топ-10 кандидатов`);
    parts.push(
      `**Примечание:** Показаны только топ-10 кандидатов из ${candidates.length}. Для анализа остальных задавайте уточняющие вопросы.\n`,
    );

    const sortedCandidates = [...candidates].sort((a, b) => {
      const scoreA = a.compositeScore ?? a.screeningDetailedScore ?? 0;
      const scoreB = b.compositeScore ?? b.screeningDetailedScore ?? 0;
      return scoreB - scoreA;
    });

    const top10 = sortedCandidates.slice(0, 10);
    for (const candidate of top10) {
      parts.push(formatCandidate(candidate));
      parts.push("");
    }

    return parts.join("\n");
  }

  parts.push(`\n# Все кандидаты\n`);

  const sortedCandidates = [...candidates].sort((a, b) => {
    const scoreA = a.compositeScore ?? a.screeningDetailedScore ?? 0;
    const scoreB = b.compositeScore ?? b.screeningDetailedScore ?? 0;
    return scoreB - scoreA;
  });

  for (const candidate of sortedCandidates) {
    parts.push(formatCandidate(candidate));
    parts.push("");
  }

  return parts.join("\n");
}

function formatGigStatistics(ctx: Record<string, unknown>): string {
  const stats = ctx as {
    total: number;
    byStatus: Record<string, number>;
    byRecommendation: Record<string, number>;
    avgPrice: number | null;
    avgDeliveryDays: number | null;
    avgScreeningScore: number | null;
    avgInterviewScore: number | null;
  };

  const parts: string[] = [];

  parts.push(`# Статистика по кандидатам`);
  parts.push(`**Всего откликов:** ${stats.total}`);

  if (Object.keys(stats.byStatus).length > 0) {
    parts.push(`\n**По статусам:**`);
    for (const [status, count] of Object.entries(stats.byStatus)) {
      parts.push(`- ${status}: ${count}`);
    }
  }

  if (Object.keys(stats.byRecommendation).length > 0) {
    parts.push(`\n**По рекомендациям:**`);
    for (const [recommendation, count] of Object.entries(
      stats.byRecommendation,
    )) {
      parts.push(`- ${recommendation}: ${count}`);
    }
  }

  if (stats.avgPrice !== null) {
    parts.push(`\n**Средняя цена:** ${stats.avgPrice} ₽`);
  }

  if (stats.avgDeliveryDays !== null) {
    parts.push(`**Средние сроки:** ${stats.avgDeliveryDays} дней`);
  }

  if (stats.avgScreeningScore !== null) {
    parts.push(`**Средний screening балл:** ${stats.avgScreeningScore}/100`);
  }

  if (stats.avgInterviewScore !== null) {
    parts.push(`**Средний interview балл:** ${stats.avgInterviewScore}/100`);
  }

  return parts.join("\n");
}

export const gigPromptConfig: PromptConfig = {
  systemRole: `Ты — AI-помощник для анализа кандидатов на gig задание. Твоя задача — помогать рекрутеру принимать обоснованные решения о выборе исполнителей.

**Твои возможности:**
- Анализировать профили кандидатов и их соответствие требованиям
- Сравнивать кандидатов между собой
- Предоставлять статистику и аналитику по пулу кандидатов
- Давать рекомендации по выбору исполнителей
- Отвечать на вопросы о конкретных кандидатах

**Правила:**
- Отвечай на русском языке, четко и по существу
- Используй данные из контекста для обоснования своих ответов
- Если данных недостаточно, честно об этом скажи
- При сравнении кандидатов учитывай все доступные метрики: цену, сроки, оценки, опыт
- Выделяй ключевые моменты и давай конкретные рекомендации
- Если кандидатов нет или данных мало, предложи что можно сделать

**Формат ответа:**
- Используй markdown для форматирования
- Структурируй ответ с заголовками и списками
- Выделяй важные цифры и факты
- В конце можешь предложить 2-4 варианта следующих вопросов (quick replies)`,

  contextFormatters: {
    main: formatGigMain,
    related: formatGigRelated,
    statistics: formatGigStatistics,
  },

  welcomeMessage: `Добро пожаловать в AI помощник по анализу кандидатов! Я помогу вам выбрать лучших исполнителей для вашего задания.`,

  emptyStateMessage: `На данный момент нет откликов на это задание. Дождитесь появления кандидатов, чтобы начать анализ.`,
};
