import type {
  HrSelectionStatus,
  ResponseStatus,
} from "@qbs-autonaim/db/schema";
import { formatContacts } from "../../../../utils/format-contacts";
import { sanitizeHtml } from "../../../utils/sanitize-html";
import { calculatePriorityScore } from "./priority-score";

interface RawResponse {
  id: string;
  entityId: string;
  candidateName: string | null;
  photoFileId: string | null;
  status: ResponseStatus;
  hrSelectionStatus: HrSelectionStatus | null;
  contacts: Record<string, unknown> | null;
  profileUrl: string | null;
  telegramUsername: string | null;
  phone: string | null;
  coverLetter: string | null;
  respondedAt: Date | null;
  welcomeSentAt: Date | null;
  createdAt: Date;
}

export function mapResponseData(
  responsesRaw: RawResponse[],
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
  return responsesRaw.map((r) => {
    const screening = screenings.find((s) => s.responseId === r.id);
    const interviewScoring = interviewScorings.find(
      (is) => is.responseId === r.id,
    );
    const session = sessions.find((s) => s.responseId === r.id);
    const priorityScore = calculatePriorityScore(r, screening);

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
