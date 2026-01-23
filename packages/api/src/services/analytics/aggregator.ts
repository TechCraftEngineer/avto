/**
 * Analytics Aggregator Service
 *
 * Сервис для агрегации метрик аналитики преквалификации.
 * Обеспечивает расчёт дашборда, воронки и аналитики по вакансиям.
 */

import type { DbClient } from "@qbs-autonaim/db";
import {
  analyticsEvent,
  prequalificationSession,
  vacancy,
} from "@qbs-autonaim/db/schema";
import { and, avg, count, desc, eq, gte, lte, sql } from "@qbs-autonaim/db";

import type {
  AggregationGranularity,
  DashboardData,
  DateRange,
  FitScoreDistribution,
  FunnelMetrics,
  GetDashboardInput,
  GetVacancyAnalyticsInput,
  PeriodComparison,
  TrendData,
  TrendDataPoint,
  VacancyAnalytics,
  VacancySummary,
} from "./types";
import { AnalyticsError } from "./types";

/**
 * Сервис для агрегации метрик аналитики
 */
export class AnalyticsAggregator {
  constructor(private db: DbClient) {}

  /**
   * Получает данные дашборда для workspace
   *
   * @param input - Параметры запроса
   * @returns Данные дашборда
   */
  async getDashboard(input: GetDashboardInput): Promise<DashboardData> {
    const { workspaceId, period, granularity = "day" } = input;

    this.validateDateRange(period);

    // Получаем метрики воронки
    const funnel = await this.getFunnelMetrics(workspaceId, period);

    // Получаем статистику по сессиям
    const sessionStats = await this.getSessionStats(workspaceId, period);

    // Получаем топ вакансий
    const topVacancies = await this.getTopVacancies(workspaceId, period, 5);

    // Получаем тренды
    const trends = await this.getTrends(workspaceId, period, granularity);

    // Получаем сравнение с предыдущим периодом
    const comparison = await this.getPeriodComparison(workspaceId, period);

    // Рассчитываем конверсию
    const conversionRate =
      funnel.widgetViews > 0
        ? (funnel.applicationsSubmitted / funnel.widgetViews) * 100
        : 0;

    return {
      totalCandidates: sessionStats.totalCandidates,
      passRate: sessionStats.passRate,
      averageFitScore: sessionStats.averageFitScore,
      conversionRate: Math.round(conversionRate * 100) / 100,
      funnel,
      trends,
      topVacancies,
      comparison,
    };
  }

  /**
   * Получает аналитику по вакансии
   *
   * @param input - Параметры запроса
   * @returns Аналитика по вакансии
   */
  async getVacancyAnalytics(
    input: GetVacancyAnalyticsInput,
  ): Promise<VacancyAnalytics> {
    const { vacancyId, workspaceId, period } = input;

    this.validateDateRange(period);

    // Проверяем, что вакансия принадлежит workspace
    const [vacancyRecord] = await this.db
      .select({ id: vacancy.id, title: vacancy.title })
      .from(vacancy)
      .where(
        and(eq(vacancy.id, vacancyId), eq(vacancy.workspaceId, workspaceId)),
      )
      .limit(1);

    if (!vacancyRecord) {
      throw new AnalyticsError(
        "VACANCY_NOT_FOUND",
        "Вакансия не найдена или не принадлежит workspace",
      );
    }

    // Получаем метрики воронки для вакансии
    const funnel = await this.getVacancyFunnelMetrics(vacancyId, period);

    // Получаем статистику по сессиям вакансии
    const sessionStats = await this.getVacancySessionStats(vacancyId, period);

    // Получаем распределение fit score
    const fitScoreDistribution = await this.getFitScoreDistribution(
      vacancyId,
      period,
    );

    // Получаем дневные тренды
    const dailyTrends = await this.getVacancyDailyTrends(vacancyId, period);

    return {
      vacancyId,
      title: vacancyRecord.title,
      period,
      totalCandidates: sessionStats.totalCandidates,
      passRate: sessionStats.passRate,
      averageFitScore: sessionStats.averageFitScore,
      averageTimeToComplete: sessionStats.averageTimeToComplete,
      funnel,
      fitScoreDistribution,
      dailyTrends,
    };
  }

  /**
   * Получает метрики воронки для workspace
   */
  async getFunnelMetrics(
    workspaceId: string,
    period: DateRange,
  ): Promise<FunnelMetrics> {
    const eventCounts = await this.db
      .select({
        eventType: analyticsEvent.eventType,
        count: count(),
      })
      .from(analyticsEvent)
      .where(
        and(
          eq(analyticsEvent.workspaceId, workspaceId),
          gte(analyticsEvent.timestamp, period.from),
          lte(analyticsEvent.timestamp, period.to),
        ),
      )
      .groupBy(analyticsEvent.eventType);

    const countsMap = new Map<string, number>(
      eventCounts.map((e) => [e.eventType, Number(e.count)]),
    );

    return {
      widgetViews: countsMap.get("widget_view") ?? 0,
      sessionsStarted: countsMap.get("session_start") ?? 0,
      resumesUploaded: countsMap.get("resume_upload") ?? 0,
      dialoguesCompleted: countsMap.get("dialogue_complete") ?? 0,
      candidatesPassed: countsMap.get("evaluation_complete") ?? 0,
      applicationsSubmitted: countsMap.get("application_submit") ?? 0,
    };
  }

  /**
   * Получает статистику по сессиям
   */
  private async getSessionStats(
    workspaceId: string,
    period: DateRange,
  ): Promise<{
    totalCandidates: number;
    passRate: number;
    averageFitScore: number;
  }> {
    const [stats] = await this.db
      .select({
        total: count(),
        passed: count(
          sql`CASE WHEN ${prequalificationSession.fitDecision} IN ('strong_fit', 'potential_fit') THEN 1 END`,
        ),
        avgScore: avg(prequalificationSession.fitScore),
      })
      .from(prequalificationSession)
      .where(
        and(
          eq(prequalificationSession.workspaceId, workspaceId),
          gte(prequalificationSession.createdAt, period.from),
          lte(prequalificationSession.createdAt, period.to),
          eq(prequalificationSession.status, "completed"),
        ),
      );

    const total = Number(stats?.total ?? 0);
    const passed = Number(stats?.passed ?? 0);
    const avgScore = Number(stats?.avgScore ?? 0);

    return {
      totalCandidates: total,
      passRate: total > 0 ? Math.round((passed / total) * 100 * 100) / 100 : 0,
      averageFitScore: Math.round(avgScore * 100) / 100,
    };
  }

  /**
   * Получает топ вакансий по количеству кандидатов
   */
  private async getTopVacancies(
    workspaceId: string,
    period: DateRange,
    limit: number,
  ): Promise<VacancySummary[]> {
    const vacancyStats = await this.db
      .select({
        vacancyId: prequalificationSession.vacancyId,
        title: vacancy.title,
        candidateCount: count(),
        passed: count(
          sql`CASE WHEN ${prequalificationSession.fitDecision} IN ('strong_fit', 'potential_fit') THEN 1 END`,
        ),
        avgScore: avg(prequalificationSession.fitScore),
      })
      .from(prequalificationSession)
      .innerJoin(vacancy, eq(prequalificationSession.vacancyId, vacancy.id))
      .where(
        and(
          eq(prequalificationSession.workspaceId, workspaceId),
          gte(prequalificationSession.createdAt, period.from),
          lte(prequalificationSession.createdAt, period.to),
        ),
      )
      .groupBy(prequalificationSession.vacancyId, vacancy.title)
      .orderBy(desc(count()))
      .limit(limit);

    return vacancyStats.map((v) => {
      const candidateCount = Number(v.candidateCount);
      const passed = Number(v.passed);
      return {
        vacancyId: v.vacancyId,
        title: v.title,
        candidateCount,
        passRate:
          candidateCount > 0
            ? Math.round((passed / candidateCount) * 100 * 100) / 100
            : 0,
        averageFitScore: Math.round(Number(v.avgScore ?? 0) * 100) / 100,
      };
    });
  }

  /**
   * Получает тренды по периоду
   */
  private async getTrends(
    workspaceId: string,
    period: DateRange,
    granularity: AggregationGranularity,
  ): Promise<TrendData[]> {
    const dateFormat = this.getDateFormat(granularity);

    // Тренд по сессиям
    const sessionTrend = await this.db
      .select({
        date: sql<string>`to_char(${prequalificationSession.createdAt}, ${dateFormat})`,
        value: count(),
      })
      .from(prequalificationSession)
      .where(
        and(
          eq(prequalificationSession.workspaceId, workspaceId),
          gte(prequalificationSession.createdAt, period.from),
          lte(prequalificationSession.createdAt, period.to),
        ),
      )
      .groupBy(
        sql`to_char(${prequalificationSession.createdAt}, ${dateFormat})`,
      )
      .orderBy(
        sql`to_char(${prequalificationSession.createdAt}, ${dateFormat})`,
      );

    // Тренд по pass rate
    const passRateTrend = await this.db
      .select({
        date: sql<string>`to_char(${prequalificationSession.createdAt}, ${dateFormat})`,
        total: count(),
        passed: count(
          sql`CASE WHEN ${prequalificationSession.fitDecision} IN ('strong_fit', 'potential_fit') THEN 1 END`,
        ),
      })
      .from(prequalificationSession)
      .where(
        and(
          eq(prequalificationSession.workspaceId, workspaceId),
          gte(prequalificationSession.createdAt, period.from),
          lte(prequalificationSession.createdAt, period.to),
          eq(prequalificationSession.status, "completed"),
        ),
      )
      .groupBy(
        sql`to_char(${prequalificationSession.createdAt}, ${dateFormat})`,
      )
      .orderBy(
        sql`to_char(${prequalificationSession.createdAt}, ${dateFormat})`,
      );

    return [
      {
        metric: "sessions",
        data: sessionTrend.map((t) => ({
          date: t.date,
          value: Number(t.value),
        })),
      },
      {
        metric: "passRate",
        data: passRateTrend.map((t) => {
          const total = Number(t.total);
          const passed = Number(t.passed);
          return {
            date: t.date,
            value:
              total > 0 ? Math.round((passed / total) * 100 * 100) / 100 : 0,
          };
        }),
      },
    ];
  }

  /**
   * Получает сравнение с предыдущим периодом
   */
  private async getPeriodComparison(
    workspaceId: string,
    period: DateRange,
  ): Promise<PeriodComparison> {
    // Рассчитываем длину периода
    const periodLength = period.to.getTime() - period.from.getTime();

    // Предыдущий период
    const previousPeriod: DateRange = {
      from: new Date(period.from.getTime() - periodLength),
      to: new Date(period.from.getTime() - 1),
    };

    // Текущие метрики
    const currentStats = await this.getSessionStats(workspaceId, period);
    const currentFunnel = await this.getFunnelMetrics(workspaceId, period);
    const currentConversion =
      currentFunnel.widgetViews > 0
        ? (currentFunnel.applicationsSubmitted / currentFunnel.widgetViews) *
          100
        : 0;

    // Предыдущие метрики
    const previousStats = await this.getSessionStats(
      workspaceId,
      previousPeriod,
    );
    const previousFunnel = await this.getFunnelMetrics(
      workspaceId,
      previousPeriod,
    );
    const previousConversion =
      previousFunnel.widgetViews > 0
        ? (previousFunnel.applicationsSubmitted / previousFunnel.widgetViews) *
          100
        : 0;

    return {
      candidatesChange: this.calculateChange(
        previousStats.totalCandidates,
        currentStats.totalCandidates,
      ),
      passRateChange: this.calculateChange(
        previousStats.passRate,
        currentStats.passRate,
      ),
      averageFitScoreChange: this.calculateChange(
        previousStats.averageFitScore,
        currentStats.averageFitScore,
      ),
      conversionRateChange: this.calculateChange(
        previousConversion,
        currentConversion,
      ),
    };
  }

  /**
   * Получает метрики воронки для вакансии
   */
  private async getVacancyFunnelMetrics(
    vacancyId: string,
    period: DateRange,
  ): Promise<FunnelMetrics> {
    const eventCounts = await this.db
      .select({
        eventType: analyticsEvent.eventType,
        count: count(),
      })
      .from(analyticsEvent)
      .where(
        and(
          eq(analyticsEvent.vacancyId, vacancyId),
          gte(analyticsEvent.timestamp, period.from),
          lte(analyticsEvent.timestamp, period.to),
        ),
      )
      .groupBy(analyticsEvent.eventType);

    const countsMap = new Map<string, number>(
      eventCounts.map((e) => [e.eventType, Number(e.count)]),
    );

    return {
      widgetViews: countsMap.get("widget_view") ?? 0,
      sessionsStarted: countsMap.get("session_start") ?? 0,
      resumesUploaded: countsMap.get("resume_upload") ?? 0,
      dialoguesCompleted: countsMap.get("dialogue_complete") ?? 0,
      candidatesPassed: countsMap.get("evaluation_complete") ?? 0,
      applicationsSubmitted: countsMap.get("application_submit") ?? 0,
    };
  }

  /**
   * Получает статистику по сессиям вакансии
   */
  private async getVacancySessionStats(
    vacancyId: string,
    period: DateRange,
  ): Promise<{
    totalCandidates: number;
    passRate: number;
    averageFitScore: number;
    averageTimeToComplete: number;
  }> {
    const [stats] = await this.db
      .select({
        total: count(),
        passed: count(
          sql`CASE WHEN ${prequalificationSession.fitDecision} IN ('strong_fit', 'potential_fit') THEN 1 END`,
        ),
        avgScore: avg(prequalificationSession.fitScore),
        avgTime: avg(
          sql`EXTRACT(EPOCH FROM (${prequalificationSession.updatedAt} - ${prequalificationSession.createdAt})) / 60`,
        ),
      })
      .from(prequalificationSession)
      .where(
        and(
          eq(prequalificationSession.vacancyId, vacancyId),
          gte(prequalificationSession.createdAt, period.from),
          lte(prequalificationSession.createdAt, period.to),
          eq(prequalificationSession.status, "completed"),
        ),
      );

    const total = Number(stats?.total ?? 0);
    const passed = Number(stats?.passed ?? 0);
    const avgScore = Number(stats?.avgScore ?? 0);
    const avgTime = Number(stats?.avgTime ?? 0);

    return {
      totalCandidates: total,
      passRate: total > 0 ? Math.round((passed / total) * 100 * 100) / 100 : 0,
      averageFitScore: Math.round(avgScore * 100) / 100,
      averageTimeToComplete: Math.round(avgTime * 100) / 100,
    };
  }

  /**
   * Получает распределение fit score для вакансии
   */
  private async getFitScoreDistribution(
    vacancyId: string,
    period: DateRange,
  ): Promise<FitScoreDistribution[]> {
    const ranges = [
      { min: 0, max: 20, label: "0-20" },
      { min: 21, max: 40, label: "21-40" },
      { min: 41, max: 60, label: "41-60" },
      { min: 61, max: 80, label: "61-80" },
      { min: 81, max: 100, label: "81-100" },
    ];

    const distribution = await this.db
      .select({
        range: sql<string>`
          CASE 
            WHEN ${prequalificationSession.fitScore} BETWEEN 0 AND 20 THEN '0-20'
            WHEN ${prequalificationSession.fitScore} BETWEEN 21 AND 40 THEN '21-40'
            WHEN ${prequalificationSession.fitScore} BETWEEN 41 AND 60 THEN '41-60'
            WHEN ${prequalificationSession.fitScore} BETWEEN 61 AND 80 THEN '61-80'
            WHEN ${prequalificationSession.fitScore} BETWEEN 81 AND 100 THEN '81-100'
          END
        `,
        count: count(),
      })
      .from(prequalificationSession)
      .where(
        and(
          eq(prequalificationSession.vacancyId, vacancyId),
          gte(prequalificationSession.createdAt, period.from),
          lte(prequalificationSession.createdAt, period.to),
          sql`${prequalificationSession.fitScore} IS NOT NULL`,
        ),
      )
      .groupBy(
        sql`
          CASE 
            WHEN ${prequalificationSession.fitScore} BETWEEN 0 AND 20 THEN '0-20'
            WHEN ${prequalificationSession.fitScore} BETWEEN 21 AND 40 THEN '21-40'
            WHEN ${prequalificationSession.fitScore} BETWEEN 41 AND 60 THEN '41-60'
            WHEN ${prequalificationSession.fitScore} BETWEEN 61 AND 80 THEN '61-80'
            WHEN ${prequalificationSession.fitScore} BETWEEN 81 AND 100 THEN '81-100'
          END
        `,
      );

    const countsMap = new Map<string, number>(
      distribution.map((d) => [d.range, Number(d.count)]),
    );
    const total = distribution.reduce((sum, d) => sum + Number(d.count), 0);

    return ranges.map((r) => {
      const rangeCount = countsMap.get(r.label) ?? 0;
      return {
        range: r.label,
        count: rangeCount,
        percentage:
          total > 0 ? Math.round((rangeCount / total) * 100 * 100) / 100 : 0,
      };
    });
  }

  /**
   * Получает дневные тренды для вакансии
   */
  private async getVacancyDailyTrends(
    vacancyId: string,
    period: DateRange,
  ): Promise<TrendDataPoint[]> {
    const trend = await this.db
      .select({
        date: sql<string>`to_char(${prequalificationSession.createdAt}, 'YYYY-MM-DD')`,
        value: count(),
      })
      .from(prequalificationSession)
      .where(
        and(
          eq(prequalificationSession.vacancyId, vacancyId),
          gte(prequalificationSession.createdAt, period.from),
          lte(prequalificationSession.createdAt, period.to),
        ),
      )
      .groupBy(sql`to_char(${prequalificationSession.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(
        sql`to_char(${prequalificationSession.createdAt}, 'YYYY-MM-DD')`,
      );

    return trend.map((t) => ({
      date: t.date,
      value: Number(t.value),
    }));
  }

  /**
   * Возвращает формат даты для SQL в зависимости от гранулярности
   */
  private getDateFormat(granularity: AggregationGranularity): string {
    switch (granularity) {
      case "day":
        return "YYYY-MM-DD";
      case "week":
        return "IYYY-IW"; // ISO week
      case "month":
        return "YYYY-MM";
      default:
        return "YYYY-MM-DD";
    }
  }

  /**
   * Рассчитывает процентное изменение
   */
  private calculateChange(previous: number, current: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100 * 100) / 100;
  }

  /**
   * Валидирует диапазон дат
   */
  private validateDateRange(period: DateRange): void {
    if (period.from > period.to) {
      throw new AnalyticsError(
        "INVALID_DATE_RANGE",
        "Дата начала не может быть позже даты окончания",
      );
    }

    // Максимальный период - 1 год
    const maxPeriod = 365 * 24 * 60 * 60 * 1000;
    if (period.to.getTime() - period.from.getTime() > maxPeriod) {
      throw new AnalyticsError(
        "INVALID_DATE_RANGE",
        "Максимальный период запроса - 1 год",
      );
    }
  }
}
