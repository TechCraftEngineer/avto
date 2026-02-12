import type {
  HrSelectionStatus,
  ResponseStatus,
} from "@qbs-autonaim/db/schema";

interface ResponseData {
  status: ResponseStatus;
  hrSelectionStatus: HrSelectionStatus | null;
  respondedAt: Date | null;
  createdAt: Date;
}

interface ScreeningData {
  overallScore: number | null;
}

export function calculatePriorityScore(
  response: ResponseData,
  screening: ScreeningData | undefined,
): number {
  const fitScore = screening?.overallScore ?? 0;
  let priorityScore = fitScore * 0.4;

  const now = Date.now();
  const respondedAt =
    response.respondedAt?.getTime() ?? response.createdAt.getTime();
  const hoursSinceResponse = (now - respondedAt) / (1000 * 60 * 60);
  const freshnessScore = Math.max(0, 100 - hoursSinceResponse * 2);
  priorityScore += freshnessScore * 0.2;

  const screeningBonus = screening ? 50 : 0;
  priorityScore += screeningBonus * 0.2;

  let statusBonus = 0;
  if (
    response.hrSelectionStatus === "RECOMMENDED" ||
    response.hrSelectionStatus === "INVITE"
  ) {
    statusBonus = 50;
  } else if (response.status === "EVALUATED") {
    statusBonus = 30;
  }
  priorityScore += statusBonus * 0.2;

  return Math.round(Math.min(100, Math.max(0, priorityScore)));
}
