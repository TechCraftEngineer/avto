import type {
  HrSelectionStatus,
  ResponseStatus,
} from "@qbs-autonaim/db/schema";

interface ResponseForPriority {
  status: ResponseStatus;
  hrSelectionStatus: HrSelectionStatus | null;
  respondedAt: Date | null;
  createdAt: Date;
}

interface ScreeningForPriority {
  score: number;
}

export function calculatePriorityScore(
  response: ResponseForPriority,
  screening: ScreeningForPriority | undefined,
): number {
  // Базовый score из fitScore (40%)
  const fitScore = screening?.score ?? 0;
  let priorityScore = fitScore * 0.4;

  // Новизна отклика (20%)
  const now = Date.now();
  const respondedAt =
    response.respondedAt?.getTime() ?? response.createdAt.getTime();
  const hoursSinceResponse = (now - respondedAt) / (1000 * 60 * 60);
  const freshnessScore = Math.max(0, 100 - hoursSinceResponse * 2); // Убывает на 2 пункта в час
  priorityScore += freshnessScore * 0.2;

  // Штраф за отсутствие скрининга (20%)
  const screeningBonus = screening ? 50 : 0;
  priorityScore += screeningBonus * 0.2;

  // Бонус за статус (20%)
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
