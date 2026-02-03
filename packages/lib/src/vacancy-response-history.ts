import type { db as dbType } from "@qbs-autonaim/db/client";
import {
  type ResponseEventType,
  responseHistory,
} from "@qbs-autonaim/db/schema";

interface LogEventParams {
  db: typeof dbType;
  responseId: string;
  eventType: ResponseEventType;
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
