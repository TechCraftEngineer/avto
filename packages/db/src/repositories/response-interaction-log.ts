import type { db as dbType } from "../client";
import {
  type InteractionChannel,
  type InteractionSource,
  type InteractionType,
  responseInteractionLog,
} from "../schema";

interface LogResponseInteractionParams {
  db: typeof dbType;
  responseId: string;
  interactionType: InteractionType;
  source: InteractionSource;
  channel?: InteractionChannel | null;
  metadata?: Record<string, unknown> | null;
  happenedAt?: Date;
  createdByUserId?: string | null;
  note?: string | null;
}

export async function logResponseInteraction({
  db,
  responseId,
  interactionType,
  source,
  channel = null,
  metadata = null,
  happenedAt = new Date(),
  createdByUserId = null,
  note = null,
}: LogResponseInteractionParams) {
  await db.insert(responseInteractionLog).values({
    responseId,
    interactionType,
    source,
    channel,
    metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
    happenedAt,
    createdByUserId,
    note,
  });
}
