/**
 * Track Event Procedure
 *
 * Записывает событие аналитики.
 * Публичная процедура - используется виджетом на внешних сайтах.
 */

import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { publicProcedure } from "../../orpc";
import { AnalyticsError, AnalyticsTracker } from "../../services/analytics";

const trackEventInputSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId обязателен"),
  vacancyId: z.uuid().optional(),
  sessionId: z.uuid().optional(),
  eventType: z.enum([
    "widget_view",
    "session_start",
    "resume_upload",
    "dialogue_message",
    "dialogue_complete",
    "evaluation_complete",
    "application_submit",
    "web_chat_start",
    "telegram_chat_start",
    "communication_channel_selected",
  ]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const trackEvent = publicProcedure
  .input(trackEventInputSchema)
  .handler(async ({ context, input }) => {
    const analyticsTracker = new AnalyticsTracker(context.db);

    try {
      const event = await analyticsTracker.trackEvent({
        workspaceId: input.workspaceId,
        vacancyId: input.vacancyId,
        sessionId: input.sessionId,
        eventType: input.eventType,
        metadata: input.metadata,
      });

      return {
        success: true,
        eventId: event.id,
      };
    } catch (error) {
      if (error instanceof AnalyticsError) {
        throw new ORPCError("BAD_REQUEST", {
          message: error.userMessage,
          cause: error,
        });
      }
      throw error;
    }
  });
