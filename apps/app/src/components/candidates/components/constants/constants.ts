import type { FunnelStage } from "./types";

export const STAGES: { id: FunnelStage; title: string; color: string }[] = [
  { id: "SCREENING_DONE", title: "Скрининг выполнен", color: "bg-blue-500" },
  { id: "INTERVIEW", title: "Чат Интервью", color: "bg-cyan-500" },
  { id: "OFFER_SENT", title: "Оффер отправлен", color: "bg-indigo-500" },
  { id: "SECURITY_PASSED", title: "СБ пройдена", color: "bg-violet-500" },
  { id: "CONTRACT_SENT", title: "Договор отправлен", color: "bg-amber-500" },
  { id: "ONBOARDING", title: "Онбординг", color: "bg-emerald-500" },
  { id: "REJECTED", title: "Отказ/Не подходит", color: "bg-rose-500" },
];

export const pluralizeCandidate = (count: number): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) return "кандидатов";
  if (mod10 === 1) return "кандидат";
  if (mod10 >= 2 && mod10 <= 4) return "кандидата";
  return "кандидатов";
};
