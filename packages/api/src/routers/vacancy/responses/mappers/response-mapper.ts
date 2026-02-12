import type {
  HrSelectionStatus,
  ImportSource,
  ResponseScreening,
  ResponseStatus,
  StoredProfileData,
} from "@qbs-autonaim/db/schema";
import { formatContacts } from "../../../../utils/format-contacts";
import { sanitizeHtml } from "../../../utils/sanitize-html";
import { calculatePriorityScore } from "../utils/priority-score";
import { mapScreeningToOutput } from "./screening-mapper";

interface RawResponse {
  id: string;
  entityId: string;
  candidateName: string | null;
  photoFileId: string | null;
  birthDate: Date | null;
  globalCandidateId: string | null;
  status: ResponseStatus;
  hrSelectionStatus: HrSelectionStatus | null;
  contacts: Record<string, unknown> | null;
  profileUrl: string | null;
  profileData: StoredProfileData | null;
  resumeUrl: string | null;
  telegramUsername: string | null;
  phone: string | null;
  email: string | null;
  coverLetter: string | null;
  respondedAt: Date | null;
  welcomeSentAt: Date | null;
  createdAt: Date;
  salaryExpectationsAmount: number | null;
  salaryExpectationsComment: string | null;
  skills: string[] | null;
  rating: string | null;
  importSource: ImportSource | null;
}

interface InterviewScoringData {
  responseId: string | null;
  score: number;
  rating: number | null;
  analysis: string | null;
  botUsageDetected: number | null;
}

interface SessionData {
  id: string;
  responseId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface GlobalCandidateData {
  id: string;
  location: string | null;
}

/** Строит Map из массива по ключу-экстрактору */
function buildLookupMap<T>(
  items: T[],
  keyExtractor: (item: T) => string | null,
): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    const key = keyExtractor(item);
    if (key !== null) {
      map.set(key, item);
    }
  }
  return map;
}

function mapInterviewScoring(scoring: InterviewScoringData) {
  return {
    score: scoring.rating ?? Math.round(scoring.score / 20),
    detailedScore: scoring.score,
    analysis: scoring.analysis ? sanitizeHtml(scoring.analysis) : null,
    botUsageDetected:
      scoring.botUsageDetected !== null ? scoring.botUsageDetected > 50 : null,
  };
}

function mapInterviewSession(
  session: SessionData,
  messageCountsMap: Map<string, number>,
) {
  return {
    id: session.id,
    status: session.status,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    messageCount: messageCountsMap.get(session.id) ?? 0,
  };
}

export function mapResponsesToOutput(
  responsesRaw: RawResponse[],
  screenings: ResponseScreening[],
  interviewScorings: InterviewScoringData[],
  sessions: SessionData[],
  globalCandidates: GlobalCandidateData[],
  messageCountsMap: Map<string, number>,
  commentCountsMap: Map<string, number>,
) {
  // Строим lookup-карты для O(1) доступа вместо O(n) find()
  const screeningByResponseId = buildLookupMap(screenings, (s) => s.responseId);
  const scoringByResponseId = buildLookupMap(
    interviewScorings,
    (s) => s.responseId,
  );
  const sessionByResponseId = buildLookupMap(sessions, (s) => s.responseId);
  const candidateById = buildLookupMap(globalCandidates, (c) => c.id);

  return responsesRaw.map((r) => {
    const screening = screeningByResponseId.get(r.id) ?? null;
    const interviewScoring = scoringByResponseId.get(r.id);
    const session = sessionByResponseId.get(r.id);
    const globalCandidate = r.globalCandidateId
      ? (candidateById.get(r.globalCandidateId) ?? null)
      : null;
    const priorityScore = calculatePriorityScore(r, screening ?? undefined);

    return {
      ...r,
      contacts: formatContacts(r.contacts),
      coverLetter: r.coverLetter ? sanitizeHtml(r.coverLetter) : null,
      globalCandidate,
      priorityScore,
      screening: mapScreeningToOutput(screening),
      interviewScoring: interviewScoring
        ? mapInterviewScoring(interviewScoring)
        : null,
      interviewSession: session
        ? mapInterviewSession(session, messageCountsMap)
        : null,
      commentCount: commentCountsMap.get(r.id) ?? 0,
    };
  });
}
