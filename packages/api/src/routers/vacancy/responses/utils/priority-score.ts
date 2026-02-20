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
  // Если нет оценки AI (новый отклик), приоритет = 0
  // Оценённые отклики получают приоритет на основе оценки
  if (!screening?.overallScore) {
    return 0;
  }

  // Оценка AI — основа приоритета (60% веса)
  const fitScore = screening.overallScore;
  let priorityScore = fitScore * 0.6;

  // Новизна отклика (20% веса)
  const now = Date.now();
  const respondedAt =
    response.respondedAt?.getTime() ?? response.createdAt.getTime();
  const hoursSinceResponse = (now - respondedAt) / (1000 * 60 * 60);
  const freshnessScore = Math.max(0, 100 - hoursSinceResponse * 2);
  priorityScore += freshnessScore * 0.2;

  // Бонус за HR-статус (20% веса)
  let statusBonus = 0;
  if (
    response.hrSelectionStatus === "RECOMMENDED" ||
    response.hrSelectionStatus === "INVITE"
  ) {
    statusBonus = 50;
  }
  priorityScore += statusBonus * 0.2;

  return Math.round(Math.min(100, Math.max(0, priorityScore)));
}
