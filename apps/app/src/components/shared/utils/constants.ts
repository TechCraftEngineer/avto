import type {
  HrSelectionStatus,
  ResponseStatus,
} from "@qbs-autonaim/db/schema";
import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  Eye,
  FileText,
  MessageSquare,
  XCircle,
} from "lucide-react";

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
    icon?: LucideIcon;
  }
> = {
  NEW: { label: "Новый", variant: "default", icon: FileText },
  EVALUATED: { label: "Оценен", variant: "secondary", icon: Eye },
  INTERVIEW: { label: "Интервью", variant: "outline", icon: MessageSquare },
  NEGOTIATION: { label: "Переговоры", variant: "outline", icon: MessageSquare },
  COMPLETED: { label: "Завершен", variant: "secondary", icon: CheckCircle2 },
  SKIPPED: { label: "Пропущен", variant: "destructive", icon: XCircle },
};

export const HR_STATUS_CONFIG: Record<
  HrSelectionStatus,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  INVITE: { label: "Приглашение", variant: "default" },
  RECOMMENDED: { label: "Рекомендован", variant: "secondary" },
  NOT_RECOMMENDED: { label: "Не рекомендован", variant: "destructive" },
  REJECTED: { label: "Отклонен", variant: "destructive" },
  SELECTED: { label: "Выбран", variant: "secondary" },
  OFFER: { label: "Оффер", variant: "secondary" },
  SECURITY_PASSED: { label: "СБ пройдена", variant: "secondary" },
  CONTRACT_SENT: { label: "Договор отправлен", variant: "outline" },
  IN_PROGRESS: { label: "В процессе", variant: "outline" },
  ONBOARDING: { label: "Онбординг", variant: "default" },
  DONE: { label: "Завершен", variant: "default" },
};

export const IMPORT_SOURCE_LABELS: Record<string, string> = {
  hh: "HeadHunter",
  telegram: "Telegram",
  manual: "Вручную",
  api: "API",
};
