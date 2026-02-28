import {
  CheckCircle2,
  FileText,
  MessageSquare,
  TrendingUp,
  XCircle,
} from "lucide-react";

export const RESPONSE_STATUS_CONFIG = {
  NEW: { label: "Новый", variant: "default" as const, icon: FileText },
  EVALUATED: {
    label: "Оценен",
    variant: "secondary" as const,
    icon: CheckCircle2,
  },
  INTERVIEW: {
    label: "Интервью",
    variant: "default" as const,
    icon: MessageSquare,
  },
  NEGOTIATION: {
    label: "Переговоры",
    variant: "outline" as const,
    icon: TrendingUp,
  },
  COMPLETED: {
    label: "Завершен",
    variant: "secondary" as const,
    icon: CheckCircle2,
  },
  SKIPPED: {
    label: "Пропущен",
    variant: "destructive" as const,
    icon: XCircle,
  },
} as const;

export const HR_STATUS_CONFIG = {
  INVITE: { label: "Пригласить", variant: "default" as const },
  RECOMMENDED: { label: "Рекомендован", variant: "secondary" as const },
  NOT_RECOMMENDED: { label: "Не рекомендован", variant: "outline" as const },
  REJECTED: { label: "Отклонен", variant: "destructive" as const },
  SELECTED: { label: "Выбран", variant: "default" as const },
  OFFER: { label: "Оффер", variant: "default" as const },
  SECURITY_PASSED: { label: "СБ пройдена", variant: "secondary" as const },
  CONTRACT_SENT: { label: "Контракт отправлен", variant: "secondary" as const },
  IN_PROGRESS: { label: "В работе", variant: "default" as const },
  ONBOARDING: { label: "Онбординг", variant: "default" as const },
  DONE: { label: "Выполнено", variant: "secondary" as const },
} as const;

export const IMPORT_SOURCE_LABELS: Record<string, string> = {
  MANUAL: "Ручной ввод",
  HH: "HeadHunter",
  AVITO: "Avito",
  SUPERJOB: "SuperJob",
  KWORK: "Kwork",
  HABR: "Хабр Карьера",
  FL_RU: "FL.ru",
  FREELANCE_RU: "Freelance.ru",
  WEB_LINK: "Другая платформа",
  TELEGRAM: "Telegram",
};

export function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatCurrency(amount: number | null) {
  if (!amount) return "—";
  return `${new Intl.NumberFormat("ru-RU").format(amount)}\u00A0₽`;
}

export type StatusKey = keyof typeof RESPONSE_STATUS_CONFIG;
export type HRStatusKey = keyof typeof HR_STATUS_CONFIG;

export function getStatusLabel(status: string): string {
  if (status in RESPONSE_STATUS_CONFIG) {
    return RESPONSE_STATUS_CONFIG[status as StatusKey].label;
  }
  return status;
}
