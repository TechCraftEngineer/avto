import { formatContacts } from "../../../../utils/format-contacts";
import { sanitizeHtml } from "../../../utils/sanitize-html";
import type { RawResponseBase } from "../types";
import { calculatePriorityScore } from "./priority-score";

function buildLookupMap<T>(
  items: T[],
  keyExtractor: (item: T) => string | null,
): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    const key = keyExtractor(item);
    if (key !== null) map.set(key, item);
  }
  return map;
}

export function mapResponseData(
  responsesRaw: RawResponseBase[],
  screenings: Array<{
    responseId: string | null;
    overallScore: number | null;
    overallAnalysis: string | null;
    potentialScore: number | null;
    careerTrajectoryScore: number | null;
    careerTrajectoryType: string | null;
    hiddenFitIndicators: string[] | null;
    potentialAnalysis: string | null;
    careerTrajectoryAnalysis: string | null;
    hiddenFitAnalysis: string | null;
  }>,
  interviewScorings: Array<{
    responseId: string | null;
    score: number;
    rating: number | null;
    analysis: string | null;
    botUsageDetected: number | null;
  }>,
  sessions: Array<{
    id: string;
    responseId: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }>,
  messageCountsMap: Map<string, number>,
) {
  const screeningByResponseId = buildLookupMap(screenings, (s) => s.responseId);
  const scoringByResponseId = buildLookupMap(
    interviewScorings,
    (s) => s.responseId,
  );
  const sessionByResponseId = buildLookupMap(sessions, (s) => s.responseId);

  return responsesRaw.map((r) => {
    const screening = screeningByResponseId.get(r.id) ?? null;
    const interviewScoring = scoringByResponseId.get(r.id);
    const session = sessionByResponseId.get(r.id);
    const priorityScore = calculatePriorityScore(r, screening ?? undefined);

    return {
      ...r,
      contacts: formatContacts(r.contacts),
      coverLetter: r.coverLetter ? sanitizeHtml(r.coverLetter) : null,
      priorityScore,
      screening: screening
        ? {
            score: screening.overallScore,
            detailedScore: screening.overallScore,
            analysis: screening.overallAnalysis
              ? sanitizeHtml(screening.overallAnalysis)
              : null,
            potentialScore: screening.potentialScore,
            careerTrajectoryScore: screening.careerTrajectoryScore,
            careerTrajectoryType: screening.careerTrajectoryType,
            hiddenFitIndicators: screening.hiddenFitIndicators,
            potentialAnalysis: screening.potentialAnalysis
              ? sanitizeHtml(screening.potentialAnalysis)
              : null,
            careerTrajectoryAnalysis: screening.careerTrajectoryAnalysis
              ? sanitizeHtml(screening.careerTrajectoryAnalysis)
              : null,
            hiddenFitAnalysis: screening.hiddenFitAnalysis
              ? sanitizeHtml(screening.hiddenFitAnalysis)
              : null,
          }
        : null,
      interviewScoring: interviewScoring
        ? {
            score:
              interviewScoring.rating ??
              Math.round(interviewScoring.score / 20),
            detailedScore: interviewScoring.score,
            analysis: interviewScoring.analysis
              ? sanitizeHtml(interviewScoring.analysis)
              : null,
            botUsageDetected: interviewScoring.botUsageDetected ?? null,
          }
        : null,
      interviewSession: session
        ? {
            id: session.id,
            status: session.status,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            messageCount: messageCountsMap.get(session.id) || 0,
          }
        : null,
    };
  });
}
