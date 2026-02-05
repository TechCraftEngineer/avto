import type { DbClient } from "@qbs-autonaim/db";
import { inArray, sql } from "@qbs-autonaim/db";
import {
  candidate,
  interviewMessage,
  interviewScoring,
  interviewSession,
  responseComment,
  responseScreening,
} from "@qbs-autonaim/db/schema";

export async function fetchGlobalCandidates(
  db: DbClient,
  globalCandidateIds: string[],
) {
  if (globalCandidateIds.length === 0) {
    return [];
  }

  return await db.query.candidate.findMany({
    where: inArray(candidate.id, globalCandidateIds),
    columns: {
      id: true,
      location: true,
    },
  });
}

export async function fetchScreenings(db: DbClient, responseIds: string[]) {
  if (responseIds.length === 0) {
    return [];
  }

  return await db.query.responseScreening.findMany({
    where: inArray(responseScreening.responseId, responseIds),
  });
}

export async function fetchInterviewScorings(
  db: DbClient,
  responseIds: string[],
) {
  if (responseIds.length === 0) {
    return [];
  }

  return await db.query.interviewScoring.findMany({
    where: inArray(interviewScoring.responseId, responseIds),
    columns: {
      responseId: true,
      score: true,
      rating: true,
      analysis: true,
      botUsageDetected: true,
    },
  });
}

export async function fetchInterviewSessions(
  db: DbClient,
  responseIds: string[],
) {
  if (responseIds.length === 0) {
    return [];
  }

  return await db.query.interviewSession.findMany({
    where: inArray(interviewSession.responseId, responseIds),
    columns: {
      id: true,
      responseId: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function fetchMessageCounts(db: DbClient, sessionIds: string[]) {
  if (sessionIds.length === 0) {
    return new Map<string, number>();
  }

  const messageCounts = await db
    .select({
      sessionId: interviewMessage.sessionId,
      count: sql<number>`count(*)::int`,
    })
    .from(interviewMessage)
    .where(inArray(interviewMessage.sessionId, sessionIds))
    .groupBy(interviewMessage.sessionId);

  return new Map(
    messageCounts.map((mc: { sessionId: string; count: number }) => [
      mc.sessionId,
      mc.count,
    ]),
  );
}

export async function fetchCommentCounts(db: DbClient, responseIds: string[]) {
  if (responseIds.length === 0) {
    return new Map<string, number>();
  }

  const commentCounts = await db
    .select({
      responseId: responseComment.responseId,
      count: sql<number>`count(*)::int`,
    })
    .from(responseComment)
    .where(inArray(responseComment.responseId, responseIds))
    .groupBy(responseComment.responseId);

  return new Map(
    commentCounts.map((cc: { responseId: string; count: number }) => [
      cc.responseId,
      cc.count,
    ]),
  );
}
