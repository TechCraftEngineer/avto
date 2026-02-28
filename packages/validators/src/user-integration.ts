import { z } from "zod";
import { workspaceIdSchema } from "./workspace";

/** Поддерживаемые типы user-интеграций */
export const userIntegrationTypeSchema = z.enum(["google_calendar"]);

export type UserIntegrationType = z.infer<typeof userIntegrationTypeSchema>;

export const createCalendarEventSchema = z.object({
  responseId: z.uuid(),
  workspaceId: workspaceIdSchema,
  scheduledAt: z.coerce.date(),
  durationMinutes: z.number().int().min(15).max(480).default(60),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  meetingUrl: z.url().optional().or(z.literal("")),
  type: z.enum(["technical", "hr", "final", "phone", "video"]).default("video"),
});

export type CreateCalendarEventInput = z.infer<
  typeof createCalendarEventSchema
>;
