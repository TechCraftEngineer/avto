import type { RouterOutputs } from "@qbs-autonaim/api";

export type FunnelStage =
  | "SCREENING_DONE"
  | "INTERVIEW"
  | "OFFER_SENT"
  | "SECURITY_PASSED"
  | "CONTRACT_SENT"
  | "ONBOARDING"
  | "REJECTED";

export type FunnelCandidate =
  RouterOutputs["candidates"]["list"]["items"][number];

export type FunnelCandidateDetail = RouterOutputs["candidates"]["getById"];

export interface FunnelComment {
  id: string;
  candidateId: string;
  author: string;
  authorAvatar?: string;
  content: string;
  isPrivate: boolean;
  createdAt: Date;
}

export interface FunnelActivity {
  id: string;
  candidateId: string;
  type: "STATUS_CHANGE" | "COMMENT" | "DOCUMENT" | "INTERVIEW" | "APPLIED";
  description: string;
  author?: string;
  createdAt: Date;
}

export const STAGE_LABELS: Record<FunnelStage, string> = {
  SCREENING_DONE: "Скрининг выполнен",
  INTERVIEW: "Чат Интервью",
  OFFER_SENT: "Оффер отправлен",
  SECURITY_PASSED: "СБ пройдена",
  CONTRACT_SENT: "Договор отправлен",
  ONBOARDING: "Онбординг",
  REJECTED: "Отказ/Не подходит",
};

export const STAGE_COLORS: Record<FunnelStage, string> = {
  SCREENING_DONE:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400",
  INTERVIEW:
    "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-400",
  OFFER_SENT:
    "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400",
  SECURITY_PASSED:
    "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-400",
  CONTRACT_SENT:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400",
  ONBOARDING:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400",
  REJECTED:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400",
};
