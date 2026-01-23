/**
 * Analytics Service Types
 *
 * Типы для сервиса аналитики преквалификации.
 * Определяет структуры данных для событий, метрик и дашбордов.
 */

// Re-export core types from DB schema for consistency
export type {
  AnalyticsEvent,
  AnalyticsEventType,
  NewAnalyticsEvent,
} from "@qbs-autonaim/db";

/**
 * Период времени для запросов аналитики
 */
export interface DateRange {
  /** Начало периода */
  from: Date;
  /** Конец периода */
  to: Date;
}

/**
 * Входные данные для создания события аналитики
 */
export interface TrackEventInput {
  /** ID workspace (tenant) */
  workspaceId: string;
  /** ID вакансии (опционально) */
  vacancyId?: string;
  /** ID сессии преквалификации (опционально) */
  sessionId?: string;
  /** Тип события */
  eventType:
    | "widget_view"
    | "session_start"
    | "resume_upload"
    | "dialogue_message"
    | "dialogue_complete"
    | "evaluation_complete"
    | "application_submit"
    | "web_chat_start"
    | "telegram_chat_start"
    | "communication_channel_selected";
  /** Дополнительные метаданные */
  metadata?: Record<string, unknown>;
}

/**
 * Метрики воронки преквалификации
 */
export interface FunnelMetrics {
  /** Просмотры виджета */
  widgetViews: number;
  /** Начатые сессии */
  sessionsStarted: number;
  /** Загруженные резюме */
  resumesUploaded: number;
  /** Завершённые диалоги */
  dialoguesCompleted: number;
  /** Кандидаты, прошедшие оценку */
  candidatesPassed: number;
  /** Отправленные заявки */
  applicationsSubmitted: number;
}

/**
 * Данные о тренде
 */
export interface TrendDataPoint {
  /** Дата */
  date: string;
  /** Значение */
  value: number;
}

/**
 * Данные о трендах
 */
export interface TrendData {
  /** Название метрики */
  metric: string;
  /** Точки данных */
  data: TrendDataPoint[];
}

/**
 * Краткая информация о вакансии для дашборда
 */
export interface VacancySummary {
  /** ID вакансии */
  vacancyId: string;
  /** Название вакансии */
  title: string;
  /** Количество кандидатов */
  candidateCount: number;
  /** Процент прохождения */
  passRate: number;
  /** Средний fit score */
  averageFitScore: number;
}

/**
 * Данные дашборда аналитики
 */
export interface DashboardData {
  /** Общее количество кандидатов */
  totalCandidates: number;
  /** Процент прохождения */
  passRate: number;
  /** Средний fit score */
  averageFitScore: number;
  /** Конверсия (от просмотра до заявки) */
  conversionRate: number;
  /** Метрики воронки */
  funnel: FunnelMetrics;
  /** Данные о трендах */
  trends: TrendData[];
  /** Топ вакансий */
  topVacancies: VacancySummary[];
  /** Сравнение с предыдущим периодом */
  comparison: PeriodComparison;
}

/**
 * Сравнение с предыдущим периодом
 */
export interface PeriodComparison {
  /** Изменение количества кандидатов (%) */
  candidatesChange: number;
  /** Изменение pass rate (%) */
  passRateChange: number;
  /** Изменение среднего fit score (%) */
  averageFitScoreChange: number;
  /** Изменение конверсии (%) */
  conversionRateChange: number;
}

/**
 * Распределение fit score
 */
export interface FitScoreDistribution {
  /** Диапазон (например, "0-20", "21-40") */
  range: string;
  /** Количество кандидатов */
  count: number;
  /** Процент от общего числа */
  percentage: number;
}

/**
 * Аналитика по вакансии
 */
export interface VacancyAnalytics {
  /** ID вакансии */
  vacancyId: string;
  /** Название вакансии */
  title: string;
  /** Период */
  period: DateRange;
  /** Общее количество кандидатов */
  totalCandidates: number;
  /** Процент прохождения */
  passRate: number;
  /** Средний fit score */
  averageFitScore: number;
  /** Среднее время прохождения (минуты) */
  averageTimeToComplete: number;
  /** Метрики воронки */
  funnel: FunnelMetrics;
  /** Распределение fit score */
  fitScoreDistribution: FitScoreDistribution[];
  /** Тренды по дням */
  dailyTrends: TrendDataPoint[];
}

/**
 * Формат экспорта данных
 */
export type ExportFormat = "csv" | "json";

/**
 * Входные данные для экспорта
 */
export interface ExportDataInput {
  /** ID workspace (tenant) */
  workspaceId: string;
  /** Период */
  period: DateRange;
  /** Формат экспорта */
  format: ExportFormat;
  /** ID вакансии (опционально, для фильтрации) */
  vacancyId?: string;
}

/**
 * Результат экспорта
 */
export interface ExportResult {
  /** Данные в указанном формате */
  data: string;
  /** MIME тип */
  mimeType: string;
  /** Имя файла */
  filename: string;
}

/**
 * Коды ошибок сервиса аналитики
 */
export type AnalyticsErrorCode =
  | "INVALID_DATE_RANGE"
  | "WORKSPACE_NOT_FOUND"
  | "VACANCY_NOT_FOUND"
  | "EXPORT_FAILED"
  | "DATABASE_ERROR";

/**
 * Ошибка сервиса аналитики
 */
export class AnalyticsError extends Error {
  readonly code: AnalyticsErrorCode;
  readonly userMessage: string;
  readonly details?: Record<string, unknown>;

  constructor(
    code: AnalyticsErrorCode,
    userMessage: string,
    details?: Record<string, unknown>,
  ) {
    super(`[${code}] ${userMessage}`);
    this.name = "AnalyticsError";
    this.code = code;
    this.userMessage = userMessage;
    this.details = details;
  }
}

/**
 * Гранулярность агрегации
 */
export type AggregationGranularity = "day" | "week" | "month";

/**
 * Входные данные для получения дашборда
 */
export interface GetDashboardInput {
  /** ID workspace (tenant) */
  workspaceId: string;
  /** Период */
  period: DateRange;
  /** Гранулярность трендов */
  granularity?: AggregationGranularity;
}

/**
 * Входные данные для получения аналитики по вакансии
 */
export interface GetVacancyAnalyticsInput {
  /** ID вакансии */
  vacancyId: string;
  /** ID workspace (tenant) для проверки доступа */
  workspaceId: string;
  /** Период */
  period: DateRange;
}
