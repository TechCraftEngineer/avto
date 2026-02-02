import type { HrStatus, ResponseStatus } from "@qbs-autonaim/db/schema";

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";

  const d = typeof date === "string" ? new Date(date) : date;

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatCurrency(
  amount: number | null | undefined,
  currency: string = "RUB",
): string {
  if (amount === null || amount === undefined) return "—";

  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export const STATUS_CONFIG: Record<
  ResponseStatus,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  NEW: { label: "Новый", variant: "default" },
  EVALUATED: { label: "Оценен", variant: "secondary" },
  INTERVIEW: { label: "Интервью", variant: "outline" },
  COMPLETED: { label: "Завершен", variant: "secondary" },
  SKIPPED: { label: "Пропущен", variant: "destructive" },
};

export const HR_STATUS_CONFIG: Record<
  HrStatus,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  NEW: { label: "Новый", variant: "default" },
  SCREENING: { label: "Скрининг", variant: "secondary" },
  INTERVIEW: { label: "Интервью", variant: "outline" },
  OFFER: { label: "Оффер", variant: "secondary" },
  HIRED: { label: "Нанят", variant: "default" },
  REJECTED: { label: "Отклонен", variant: "destructive" },
};

export const IMPORT_SOURCE_LABELS: Record<string, string> = {
  hh: "HeadHunter",
  telegram: "Telegram",
  manual: "Вручную",
  api: "API",
};
