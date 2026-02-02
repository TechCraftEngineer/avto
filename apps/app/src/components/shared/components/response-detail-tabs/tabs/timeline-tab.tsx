"use client";

import { ScrollArea } from "@qbs-autonaim/ui";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  UserCheck,
} from "lucide-react";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";
import type { JsonValue } from "./value-change-display";
import { ValueChangeDisplay } from "./value-change-display";

interface TimelineTabProps {
  responseId: string;
}

const EVENT_ICONS = {
  STATUS_CHANGED: CheckCircle2,
  HR_STATUS_CHANGED: UserCheck,
  TELEGRAM_USERNAME_ADDED: MessageSquare,
  CHAT_ID_ADDED: MessageSquare,
  PHONE_ADDED: Phone,
  RESUME_UPDATED: FileText,
  PHOTO_ADDED: FileText,
  WELCOME_SENT: Mail,
  OFFER_SENT: Mail,
  COMMENT_ADDED: MessageSquare,
  SALARY_UPDATED: AlertCircle,
  CONTACT_INFO_UPDATED: Phone,
  CREATED: Clock,
  SCREENING_COMPLETED: CheckCircle2,
  INTERVIEW_STARTED: MessageSquare,
  INTERVIEW_COMPLETED: CheckCircle2,
} as const;

const EVENT_LABELS = {
  STATUS_CHANGED: "Изменен статус",
  HR_STATUS_CHANGED: "Изменен HR статус",
  TELEGRAM_USERNAME_ADDED: "Добавлен Telegram",
  CHAT_ID_ADDED: "Добавлен Chat ID",
  PHONE_ADDED: "Добавлен телефон",
  RESUME_UPDATED: "Обновлено резюме",
  PHOTO_ADDED: "Добавлено фото",
  WELCOME_SENT: "Отправлено приветствие",
  OFFER_SENT: "Отправлен оффер",
  COMMENT_ADDED: "Добавлен комментарий",
  SALARY_UPDATED: "Обновлена зарплата",
  CONTACT_INFO_UPDATED: "Обновлены контакты",
  CREATED: "Создан отклик",
  SCREENING_COMPLETED: "Завершен скрининг",
  INTERVIEW_STARTED: "Начато интервью",
  INTERVIEW_COMPLETED: "Завершено интервью",
} as const;

export function TimelineTab({ responseId }: TimelineTabProps) {
  const { workspace } = useWorkspace();
  const trpc = useTRPC();

  const { data: history, isLoading } = useQuery({
    ...trpc.vacancy.responses.history.queryOptions({
      responseId,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={`timeline-skeleton-${index}-${Date.now()}`}
            className="flex gap-3 animate-pulse"
          >
            <div className="w-8 h-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 text-center py-12 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">История событий пока пуста</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="relative space-y-4">
        {/* Вертикальная линия */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

        {history.map((event) => {
          const Icon =
            EVENT_ICONS[event.eventType as keyof typeof EVENT_ICONS] || Clock;
          const label =
            EVENT_LABELS[event.eventType as keyof typeof EVENT_LABELS] ||
            event.eventType;

          return (
            <div key={event.id} className="relative flex gap-4 pl-0">
              {/* Иконка события */}
              <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-primary shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>

              {/* Контент события */}
              <div className="flex-1 pb-4">
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-semibold">{label}</h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(event.createdAt), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </span>
                  </div>

                  {event.userId && (
                    <p className="text-xs text-muted-foreground mb-2">
                      Пользователь: {event.userId}
                    </p>
                  )}

                  <ValueChangeDisplay
                    oldValue={event.oldValue as JsonValue | null | undefined}
                    newValue={event.newValue as JsonValue | null | undefined}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
