import type {
  HrSelectionStatus,
  ResponseScreening,
  ResponseStatus,
  StoredProfileData,
} from "@qbs-autonaim/db/schema";
import { formatContacts } from "../../../../utils/format-contacts";
import { sanitizeHtml } from "../../../utils/sanitize-html";
import { calculatePriorityScore } from "../utils/priority-score";
import { mapScreeningToOutput } from "./screening-mapper";

export function mapResponsesToOutput(
  responsesRaw: Array<{
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
  }>,
  screenings: Array<ResponseScreening>,
  interviewScorings: Array<{
    responseId: string | null;
    score: number;
    rating: number | null;
    analysis: string | null;
    botUsageDetected: number | null;
  }>,
  sessions: Array<{
    id: string;
    responseId: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }>,
  globalCandidates: Array<{
    id: string;
    location: string | null;
  }>,
  messageCountsMap: Map<string, number>,
  commentCountsMap: Map<string, number>,
) {
  return responsesRaw.map((r) => {
    const screening = screenings.find((s) => s.responseId === r.id) ?? null;
    const interviewScoring = interviewScorings.find(
      (is) => is.responseId === r.id,
    );
    const session = sessions.find((s) => s.responseId === r.id);
    const globalCandidate = globalCandidates.find(
      (gc) => gc.id === r.globalCandidateId,
    );
    const priorityScore = calculatePriorityScore(r, screening);

    return {
      ...r,
      contacts: formatContacts(r.contacts),
      coverLetter: r.coverLetter ? sanitizeHtml(r.coverLetter) : null,
      globalCandidate: globalCandidate ?? null,
      priorityScore,
      // Используем новый маппер для скрининга
      screening: mapScreeningToOutput(screening),
      interviewScoring: interviewScoring
        ? {
            score:
              interviewScoring.rating ??
              Math.round(interviewScoring.score / 20),
            detailedScore: interviewScoring.score,
            analysis: interviewScoring.analysis
              ? sanitizeHtml(interviewScoring.analysis)
              : null,
            botUsageDetected:
              interviewScoring.botUsageDetected !== null
                ? interviewScoring.botUsageDetected > 50
                : null,
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
      commentCount: commentCountsMap.get(r.id) || 0,
    };
  });
}
