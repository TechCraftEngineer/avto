import type { db as dbType } from "@qbs-autonaim/db/client";
import { responseHistory } from "@qbs-autonaim/db/schema";

type EventType =
  | "STATUS_CHANGED"
  | "HR_STATUS_CHANGED"
  | "TELEGRAM_USERNAME_ADDED"
  | "CHAT_ID_ADDED"
  | "PHONE_ADDED"
  | "RESUME_UPDATED"
  | "PHOTO_ADDED"
  | "WELCOME_SENT"
  | "OFFER_SENT"
  | "COMMENT_ADDED"
  | "SALARY_UPDATED"
  | "CONTACT_INFO_UPDATED"
  | "CREATED"
  | "SCREENING_COMPLETED"
  | "INTERVIEW_STARTED"
  | "INTERVIEW_COMPLETED"
  | "CANDIDATE_LINKED";

interface LogEventParams {
  db: typeof dbType;
  responseId: string;
  eventType: EventType;
  userId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: unknown;
}

export async function logResponseEvent({
  db,
  responseId,
  eventType,
  userId,
  oldValue,
  newValue,
  metadata,
}: LogEventParams) {
  await db.insert(responseHistory).values({
    responseId,
    eventType,
    userId: userId ?? null,
    oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
    newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
    metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
  });
}
