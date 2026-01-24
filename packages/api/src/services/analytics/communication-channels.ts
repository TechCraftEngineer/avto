import type { DbClient } from "@qbs-autonaim/db";
import { AnalyticsTracker } from "./tracker";

export class CommunicationChannelsAnalytics {
  private analyticsTracker: AnalyticsTracker;

  constructor(db: DbClient) {
    this.analyticsTracker = new AnalyticsTracker(db);
  }

  /**
   * Отслеживает начало общения через веб-чат
   */
  async trackWebChatStart(params: {
    workspaceId: string;
    vacancyId: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.analyticsTracker.trackEvent({
      workspaceId: params.workspaceId,
      vacancyId: params.vacancyId,
      sessionId: params.sessionId,
      eventType: "web_chat_start",
      metadata: {
        channel: "webChat",
        ...params.metadata,
      },
    });
  }

  /**
   * Отслеживает начало общения через Telegram
   */
  async trackTelegramChatStart(params: {
    workspaceId: string;
    vacancyId: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.analyticsTracker.trackEvent({
      workspaceId: params.workspaceId,
      vacancyId: params.vacancyId,
      sessionId: params.sessionId,
      eventType: "telegram_chat_start",
      metadata: {
        channel: "telegram",
        ...params.metadata,
      },
    });
  }

  /**
   * Отслеживает выбор канала общения
   */
  async trackChannelSelection(params: {
    workspaceId: string;
    vacancyId: string;
    channel: "webChat" | "telegram";
    enabled: boolean;
    metadata?: Record<string, unknown>;
  }) {
    return this.analyticsTracker.trackEvent({
      workspaceId: params.workspaceId,
      vacancyId: params.vacancyId,
      eventType: "communication_channel_selected",
      metadata: {
        channel: params.channel,
        enabled: params.enabled,
        ...params.metadata,
      },
    });
  }
}
