/**
 * Analytics Tracker Service
 *
 * Сервис для записи событий аналитики преквалификации.
 * Обеспечивает tracking всех ключевых действий в воронке.
 */

import type { DbClient } from "@qbs-autonaim/db";
import { analyticsEvent } from "@qbs-autonaim/db/schema";

import type { AnalyticsEvent, TrackEventInput } from "./types";
import { AnalyticsError } from "./types";

/**
 * Сервис для записи событий аналитики
 */
export class AnalyticsTracker {
  constructor(private db: DbClient) {}

  /**
   * Записывает событие аналитики
   *
   * @param input - Данные события
   * @returns Созданное событие
   */
  async trackEvent(input: TrackEventInput): Promise<AnalyticsEvent> {
    try {
      const [event] = await this.db
        .insert(analyticsEvent)
        .values({
          workspaceId: input.workspaceId,
          vacancyId: input.vacancyId,
          sessionId: input.sessionId,
          eventType: input.eventType,
          metadata: input.metadata,
        })
        .returning();

      if (!event) {
        throw new AnalyticsError(
          "DATABASE_ERROR",
          "Не удалось записать событие аналитики",
        );
      }

      return event;
    } catch (error) {
      if (error instanceof AnalyticsError) {
        throw error;
      }
      throw new AnalyticsError(
        "DATABASE_ERROR",
        "Ошибка при записи события аналитики",
        { originalError: String(error) },
      );
    }
  }

  /**
   * Записывает событие просмотра виджета
   */
  async trackWidgetView(
    workspaceId: string,
    vacancyId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<AnalyticsEvent> {
    return this.trackEvent({
      workspaceId,
      vacancyId,
      eventType: "widget_view",
      metadata,
    });
  }

  /**
   * Записывает событие начала сессии
   */
  async trackSessionStart(
    workspaceId: string,
    sessionId: string,
    vacancyId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<AnalyticsEvent> {
    return this.trackEvent({
      workspaceId,
      vacancyId,
      sessionId,
      eventType: "session_start",
      metadata,
    });
  }

  /**
   * Записывает событие загрузки резюме
   */
  async trackResumeUpload(
    workspaceId: string,
    sessionId: string,
    vacancyId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<AnalyticsEvent> {
    return this.trackEvent({
      workspaceId,
      vacancyId,
      sessionId,
      eventType: "resume_upload",
      metadata,
    });
  }

  /**
   * Записывает событие сообщения в диалоге
   */
  async trackDialogueMessage(
    workspaceId: string,
    sessionId: string,
    vacancyId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<AnalyticsEvent> {
    return this.trackEvent({
      workspaceId,
      vacancyId,
      sessionId,
      eventType: "dialogue_message",
      metadata,
    });
  }

  /**
   * Записывает событие завершения диалога
   */
  async trackDialogueComplete(
    workspaceId: string,
    sessionId: string,
    vacancyId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<AnalyticsEvent> {
    return this.trackEvent({
      workspaceId,
      vacancyId,
      sessionId,
      eventType: "dialogue_complete",
      metadata,
    });
  }

  /**
   * Записывает событие завершения оценки
   */
  async trackEvaluationComplete(
    workspaceId: string,
    sessionId: string,
    vacancyId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<AnalyticsEvent> {
    return this.trackEvent({
      workspaceId,
      vacancyId,
      sessionId,
      eventType: "evaluation_complete",
      metadata,
    });
  }

  /**
   * Записывает событие отправки заявки
   */
  async trackApplicationSubmit(
    workspaceId: string,
    sessionId: string,
    vacancyId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<AnalyticsEvent> {
    return this.trackEvent({
      workspaceId,
      vacancyId,
      sessionId,
      eventType: "application_submit",
      metadata,
    });
  }

  /**
   * Записывает несколько событий в одной транзакции
   *
   * @param events - Массив событий для записи
   * @returns Массив созданных событий
   */
  async trackBatch(events: TrackEventInput[]): Promise<AnalyticsEvent[]> {
    if (events.length === 0) {
      return [];
    }

    try {
      const insertedEvents = await this.db
        .insert(analyticsEvent)
        .values(
          events.map((e) => ({
            workspaceId: e.workspaceId,
            vacancyId: e.vacancyId,
            sessionId: e.sessionId,
            eventType: e.eventType,
            metadata: e.metadata,
          })),
        )
        .returning();

      return insertedEvents;
    } catch (error) {
      throw new AnalyticsError(
        "DATABASE_ERROR",
        "Ошибка при пакетной записи событий аналитики",
        { originalError: String(error), eventsCount: events.length },
      );
    }
  }
}
