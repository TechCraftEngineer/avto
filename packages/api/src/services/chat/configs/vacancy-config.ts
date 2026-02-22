/**
 * Конфигурация промпта для vacancy
 */

import type { PromptConfig } from "../types";
import type {
  VacancyCandidateData,
  VacancyMainContext,
} from "../vacancy-types";

function formatVacancyMain(ctx: Record<string, unknown>): string {
  const vac = ctx as unknown as VacancyMainContext;
  const parts: string[] = [];

  parts.push(`# Информация о вакансии`);
  parts.push(`**Название:** ${vac.title}`);

  if (vac.description) {
    parts.push(`**Описание:** ${vac.description}`);
  }

  if (vac.region) {
    parts.push(`**Регион:** ${vac.region}`);
  }

  if (vac.requirements) {
    parts.push(`\n## Требования`);
    parts.push(JSON.stringify(vac.requirements, null, 2));
  }

  if (vac.customBotInstructions) {
    parts.push(`\n## Дополнительные инструкции`);
    parts.push(vac.customBotInstructions);
  }

  return parts.join("\n");
}

function formatCandidate(candidate: VacancyCandidateData): string {
  const parts: string[] = [];

  const name =
    candidate.candidateName || `Кандидат ${candidate.id.slice(0, 8)}`;
  parts.push(`### ${name}`);

  if (candidate.salaryExpectationsAmount) {
    parts.push(
      `- **Ожидания по зарплате:** ${candidate.salaryExpectationsAmount}`,
    );
  }

  if (candidate.profileUrl) {
    parts.push(`- **Профиль:** ${candidate.profileUrl}`);
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

function formatVacancyRelated(ctx: Record<string, unknown>): string {
  const { candidates } = ctx as { candidates: VacancyCandidateData[] };
  const parts: string[] = [];

  if (candidates.length === 0) {
    parts.push(
      `\n**?? ВАЖНО:** На данный момент нет откликов на эту вакансию.`,
    );
    parts.push(
      `\n**Рекомендации для пользователя:**\n- Проверьте, опубликована ли вакансия\n- Убедитесь, что требования и условия привлекательны для кандидатов\n- Рассмотрите возможность расширить поиск или скорректировать условия\n- Дождитесь появления откликов, прежде чем проводить анализ`,
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

function formatVacancyStatistics(ctx: Record<string, unknown>): string {
  const stats = ctx as {
    total: number;
    byStatus: Record<string, number>;
    byRecommendation: Record<string, number>;
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

  if (stats.avgScreeningScore !== null) {
    parts.push(`\n**Средний screening балл:** ${stats.avgScreeningScore}/100`);
  }

  if (stats.avgInterviewScore !== null) {
    parts.push(`**Средний interview балл:** ${stats.avgInterviewScore}/100`);
  }

  return parts.join("\n");
}

export const vacancyPromptConfig: PromptConfig = {
  systemRole: `Ты — AI-помощник для анализа кандидатов на вакансию. Твоя задача — помогать HR и рекрутерам принимать обоснованные решения о выборе кандидатов.

**Твои возможности:**
- Анализировать резюме кандидатов и их соответствие требованиям
- Сравнивать кандидатов между собой
- Предоставлять статистику и аналитику по пулу кандидатов
- Давать рекомендации по выбору кандидатов
- Отвечать на вопросы о конкретных кандидатах

**Правила:**
- Отвечай на русском языке, четко и по существу
- Используй данные из контекста для обоснования своих ответов
- Если данных недостаточно, честно об этом скажи
- При сравнении кандидатов учитывай все доступные метрики: опыт, навыки, оценки
- Выделяй ключевые моменты и давай конкретные рекомендации
- Если кандидатов нет или данных мало, предложи что можно сделать

**Формат ответа:**
- Используй markdown для форматирования
- Структурируй ответ с заголовками и списками
- Выделяй важные цифры и факты
- В конце можешь предложить 2-4 варианта следующих вопросов (quick replies)`,

  contextFormatters: {
    main: formatVacancyMain,
    related: formatVacancyRelated,
    statistics: formatVacancyStatistics,
  },

  welcomeMessage: `Добро пожаловать в AI помощник по анализу кандидатов! Я помогу вам выбрать лучших кандидатов для вашей вакансии.`,

  emptyStateMessage: `На данный момент нет откликов на эту вакансию. Дождитесь появления кандидатов, чтобы начать анализ.`,
};
