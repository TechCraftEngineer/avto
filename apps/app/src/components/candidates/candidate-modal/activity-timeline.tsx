"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  FileText,
  Image,
  Mail,
  MessageSquare,
  Phone,
  TrendingUp,
  User,
} from "lucide-react";
import { useTRPC } from "~/trpc/react";

interface ActivityTimelineProps {
  candidateId: string;
  workspaceId: string;
}

const ACTIVITY_ICONS = {
  STATUS_CHANGED: CheckCircle,
  HR_STATUS_CHANGED: CheckCircle,
  TELEGRAM_USERNAME_ADDED: MessageSquare,
  CHAT_ID_ADDED: MessageSquare,
  PHONE_ADDED: Phone,
  RESUME_UPDATED: FileText,
  PHOTO_ADDED: Image,
  WELCOME_SENT: Mail,
  COMMENT_ADDED: MessageSquare,
  SALARY_UPDATED: TrendingUp,
  CONTACT_INFO_UPDATED: User,
  CREATED: ArrowRight,
} as const;

const ACTIVITY_COLORS = {
  STATUS_CHANGED: "text-emerald-600 bg-emerald-100 border-emerald-200",
  HR_STATUS_CHANGED: "text-emerald-600 bg-emerald-100 border-emerald-200",
  TELEGRAM_USERNAME_ADDED: "text-blue-600 bg-blue-100 border-blue-200",
  CHAT_ID_ADDED: "text-blue-600 bg-blue-100 border-blue-200",
  PHONE_ADDED: "text-purple-600 bg-purple-100 border-purple-200",
  RESUME_UPDATED: "text-orange-600 bg-orange-100 border-orange-200",
  PHOTO_ADDED: "text-pink-600 bg-pink-100 border-pink-200",
  WELCOME_SENT: "text-cyan-600 bg-cyan-100 border-cyan-200",
  COMMENT_ADDED: "text-blue-600 bg-blue-100 border-blue-200",
  SALARY_UPDATED: "text-green-600 bg-green-100 border-green-200",
  CONTACT_INFO_UPDATED: "text-purple-600 bg-purple-100 border-purple-200",
  CREATED: "text-primary bg-primary/10 border-primary/20",
} as const;

const EVENT_LABELS: Record<string, string> = {
  STATUS_CHANGED: "Изменён статус",
  HR_STATUS_CHANGED: "Изменён HR статус",
  TELEGRAM_USERNAME_ADDED: "Добавлен Telegram",
  CHAT_ID_ADDED: "Добавлен Chat ID",
  PHONE_ADDED: "Добавлен телефон",
  RESUME_UPDATED: "Обновлено резюме",
  PHOTO_ADDED: "Добавлено фото",
  WELCOME_SENT: "Отправлено приветствие",
  COMMENT_ADDED: "Добавлен комментарий",
  SALARY_UPDATED: "Обновлены зарплатные ожидания",
  CONTACT_INFO_UPDATED: "Обновлены контакты",
  CREATED: "Создан отклик",
};

type HistoryEvent = {
  id: string;
  eventType: keyof typeof ACTIVITY_ICONS;
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date;
};

export function ActivityTimeline({
  candidateId,
  workspaceId,
}: ActivityTimelineProps) {
  const trpc = useTRPC();

  const historyQueryOptions = trpc.vacancy.responses.history.queryOptions({
    responseId: candidateId,
    workspaceId,
  });

  const { data, isPending } = useQuery(historyQueryOptions);

  const history = (data ?? []) as HistoryEvent[];
  const isLoading = isPending;

  const getIcon = (type: string) =>
    ACTIVITY_ICONS[type as keyof typeof ACTIVITY_ICONS] ?? CheckCircle;
  const getColor = (type: string) =>
    ACTIVITY_COLORS[type as keyof typeof ACTIVITY_COLORS] ??
    "text-primary bg-primary/10 border-primary/20";

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "string") return value;
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p className="text-sm">Нет истории</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
      {history.map((event) => {
        const Icon = getIcon(event.eventType);
        const label = EVENT_LABELS[event.eventType] ?? event.eventType;

        return (
          <div
            key={event.id}
            className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border"
          >
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full border shrink-0 ${getColor(event.eventType)}`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{label}</p>
              {(event.oldValue || event.newValue) && (
                <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                  {event.oldValue && (
                    <div className="flex items-center gap-1">
                      <span className="opacity-60">Было:</span>
                      <span className="font-mono">
                        {String(formatValue(event.oldValue))}
                      </span>
                    </div>
                  )}
                  {event.newValue && (
                    <div className="flex items-center gap-1">
                      <span className="opacity-60">Стало:</span>
                      <span className="font-mono">
                        {String(formatValue(event.newValue))}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(event.createdAt).toLocaleString("ru", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
