import { inArray, sql } from "@qbs-autonaim/db";
import { interviewMessage } from "@qbs-autonaim/db/schema";
import type { Database } from "../../../../types/database";

export async function fetchRelatedData(db: Database, responseIds: string[]) {
  if (responseIds.length === 0) {
    return {
      screenings: [],
      interviewScorings: [],
      sessions: [],
      messageCountsMap: new Map<string, number>(),
    };
  }

  const [screenings, interviewScorings, sessions] = await Promise.all([
    db.query.responseScreening.findMany({
      where: (s, { inArray }) => inArray(s.responseId, responseIds),
      columns: {
        responseId: true,
        overallScore: true,
        overallAnalysis: true,
        potentialScore: true,
        careerTrajectoryScore: true,
        careerTrajectoryType: true,
        hiddenFitIndicators: true,
        potentialAnalysis: true,
        careerTrajectoryAnalysis: true,
        hiddenFitAnalysis: true,
      },
    }),
    db.query.interviewScoring.findMany({
      where: (is, { inArray }) => inArray(is.responseId, responseIds),
      columns: {
        responseId: true,
        score: true,
        rating: true,
        analysis: true,
        botUsageDetected: true,
      },
    }),
    db.query.interviewSession.findMany({
      where: (s, { inArray }) => inArray(s.responseId, responseIds),
      columns: {
        id: true,
        responseId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  const sessionIds = sessions.map((s) => s.id);
  let messageCountsMap = new Map<string, number>();

  if (sessionIds.length > 0) {
    const messageCounts = await db
      .select({
        sessionId: interviewMessage.sessionId,
        count: sql<number>`count(*)::int`,
      })
      .from(interviewMessage)
      .where(inArray(interviewMessage.sessionId, sessionIds))
      .groupBy(interviewMessage.sessionId);

    messageCountsMap = new Map(
      messageCounts.map((mc) => [mc.sessionId, mc.count]),
    );
  }

  return {
    screenings,
    interviewScorings,
    sessions,
    messageCountsMap,
  };
}
