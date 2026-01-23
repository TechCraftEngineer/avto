/**
 * Analytics Exporter Service
 *
 * Сервис для экспорта данных аналитики в различных форматах.
 * Поддерживает CSV и JSON форматы.
 */

import type { DbClient } from "@qbs-autonaim/db";
import { prequalificationSession, vacancy } from "@qbs-autonaim/db/schema";
import { and, eq, gte, lte } from "@qbs-autonaim/db";

import type {
  DateRange,
  ExportDataInput,
  ExportFormat,
  ExportResult,
} from "./types";
import { AnalyticsError } from "./types";

/**
 * Структура данных для экспорта сессии
 */
interface ExportableSession {
  sessionId: string;
  vacancyId: string;
  vacancyTitle: string;
  status: string;
  source: string;
  fitScore: number | null;
  fitDecision: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Сервис для экспорта данных аналитики
 */
export class AnalyticsExporter {
  constructor(private db: DbClient) {}

  /**
   * Экспортирует данные аналитики в указанном формате
   *
   * @param input - Параметры экспорта
   * @returns Результат экспорта
   */
  async exportData(input: ExportDataInput): Promise<ExportResult> {
    const { workspaceId, period, format, vacancyId } = input;

    this.validateDateRange(period);

    // Получаем данные для экспорта
    const sessions = await this.getExportableSessions(
      workspaceId,
      period,
      vacancyId,
    );

    // Форматируем данные
    const data = this.formatData(sessions, format);

    // Генерируем имя файла
    const filename = this.generateFilename(workspaceId, period, format);

    return {
      data,
      mimeType: format === "csv" ? "text/csv" : "application/json",
      filename,
    };
  }

  /**
   * Получает сессии для экспорта
   */
  private async getExportableSessions(
    workspaceId: string,
    period: DateRange,
    vacancyId?: string,
  ): Promise<ExportableSession[]> {
    const conditions = [
      eq(prequalificationSession.workspaceId, workspaceId),
      gte(prequalificationSession.createdAt, period.from),
      lte(prequalificationSession.createdAt, period.to),
    ];

    if (vacancyId) {
      conditions.push(eq(prequalificationSession.vacancyId, vacancyId));
    }

    const sessions = await this.db
      .select({
        sessionId: prequalificationSession.id,
        vacancyId: prequalificationSession.vacancyId,
        vacancyTitle: vacancy.title,
        status: prequalificationSession.status,
        source: prequalificationSession.source,
        fitScore: prequalificationSession.fitScore,
        fitDecision: prequalificationSession.fitDecision,
        createdAt: prequalificationSession.createdAt,
        updatedAt: prequalificationSession.updatedAt,
      })
      .from(prequalificationSession)
      .innerJoin(vacancy, eq(prequalificationSession.vacancyId, vacancy.id))
      .where(and(...conditions))
      .orderBy(prequalificationSession.createdAt);

    return sessions.map((s) => ({
      sessionId: s.sessionId,
      vacancyId: s.vacancyId,
      vacancyTitle: s.vacancyTitle,
      status: s.status,
      source: s.source,
      fitScore: s.fitScore,
      fitDecision: s.fitDecision,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  }

  /**
   * Форматирует данные в указанный формат
   */
  private formatData(
    sessions: ExportableSession[],
    format: ExportFormat,
  ): string {
    if (format === "json") {
      return this.formatAsJson(sessions);
    }
    return this.formatAsCsv(sessions);
  }

  /**
   * Форматирует данные как JSON
   */
  private formatAsJson(sessions: ExportableSession[]): string {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        totalRecords: sessions.length,
        data: sessions,
      },
      null,
      2,
    );
  }

  /**
   * Форматирует данные как CSV
   */
  private formatAsCsv(sessions: ExportableSession[]): string {
    if (sessions.length === 0) {
      return "";
    }

    // Заголовки
    const headers = [
      "Session ID",
      "Vacancy ID",
      "Vacancy Title",
      "Status",
      "Source",
      "Fit Score",
      "Fit Decision",
      "Created At",
      "Updated At",
    ];

    // Строки данных
    const rows = sessions.map((s) => [
      this.escapeCsvValue(s.sessionId),
      this.escapeCsvValue(s.vacancyId),
      this.escapeCsvValue(s.vacancyTitle),
      this.escapeCsvValue(s.status),
      this.escapeCsvValue(s.source),
      s.fitScore !== null ? String(s.fitScore) : "",
      s.fitDecision !== null ? this.escapeCsvValue(s.fitDecision) : "",
      this.escapeCsvValue(s.createdAt),
      this.escapeCsvValue(s.updatedAt),
    ]);

    // Собираем CSV
    const csvLines = [headers.join(","), ...rows.map((row) => row.join(","))];

    return csvLines.join("\n");
  }

  /**
   * Экранирует значение для CSV
   */
  private escapeCsvValue(value: string): string {
    // Если значение содержит запятую, кавычки или перенос строки - оборачиваем в кавычки
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      // Экранируем кавычки удвоением
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Генерирует имя файла для экспорта
   */
  private generateFilename(
    workspaceId: string,
    period: DateRange,
    format: ExportFormat,
  ): string {
    const fromDate = period.from.toISOString().split("T")[0];
    const toDate = period.to.toISOString().split("T")[0];
    const extension = format === "csv" ? "csv" : "json";

    return `analytics_${workspaceId}_${fromDate}_${toDate}.${extension}`;
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

    // Максимальный период для экспорта - 1 год
    const maxPeriod = 365 * 24 * 60 * 60 * 1000;
    if (period.to.getTime() - period.from.getTime() > maxPeriod) {
      throw new AnalyticsError(
        "INVALID_DATE_RANGE",
        "Максимальный период экспорта - 1 год",
      );
    }
  }
}
