"use client";

import { Badge } from "@qbs-autonaim/ui/components/badge";
import { Button } from "@qbs-autonaim/ui/components/button";
import { ScrollArea } from "@qbs-autonaim/ui/components/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  Users,
  XCircle,
} from "lucide-react";
import { useWorkspace } from "~/hooks/use-workspace";
import { useORPC } from "~/orpc/react";
import { AddInteractionDialog } from "./add-interaction-dialog";
import type { JsonValue } from "./value-change-display";
import { ValueChangeDisplay } from "./value-change-display";

interface InteractionsTabProps {
  responseId: string;
}

// History event types (response_history)
const HISTORY_ICONS: Record<string, React.ElementType> = {
  STATUS_CHANGED: CheckCircle2,
  HR_STATUS_CHANGED: Users,
  TELEGRAM_USERNAME_ADDED: MessageSquare,
  CHAT_ID_ADDED: MessageSquare,
  PHONE_ADDED: Phone,
  RESUME_UPDATED: FileText,
  PHOTO_ADDED: FileText,
  WELCOME_SENT: Mail,
  OFFER_SENT: Mail,
  COMMENT_ADDED: MessageSquare,
  SALARY_UPDATED: XCircle,
  CONTACT_INFO_UPDATED: Phone,
  CREATED: Clock,
  SCREENING_COMPLETED: CheckCircle2,
  INTERVIEW_STARTED: MessageSquare,
  INTERVIEW_COMPLETED: CheckCircle2,
};

const HISTORY_LABELS: Record<string, string> = {
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
};

// Interaction log types
const INTERACTION_ICONS: Record<string, React.ElementType> = {
  welcome_sent: Mail,
  message_sent: MessageSquare,
  interview_scheduled: Calendar,
  interview_started: MessageSquare,
  interview_completed: CheckCircle2,
  offer_sent: Mail,
  rejection_sent: XCircle,
  call: Phone,
  email_sent: Mail,
  meeting: Users,
  note: FileText,
  followup_sent: Clock,
};

const INTERACTION_LABELS: Record<string, string> = {
  welcome_sent: "Отправлено приветствие",
  message_sent: "Сообщение отправлено",
  interview_scheduled: "Интервью запланировано",
  interview_started: "Начато интервью",
  interview_completed: "Интервью завершено",
  offer_sent: "Оффер отправлен",
  rejection_sent: "Отказ отправлен",
  call: "Звонок",
  email_sent: "Письмо отправлено",
  meeting: "Встреча",
  note: "Заметка",
  followup_sent: "Напоминание",
};

const CHANNEL_LABELS: Record<string, string> = {
  telegram: "Telegram",
  phone: "Телефон",
  email: "Email",
  kwork: "Kwork",
  in_person: "Лично",
  web_chat: "Чат",
  whatsapp: "WhatsApp",
  other: "Другое",
};

type TimelineItem =
  | {
      kind: "history";
      id: string;
      timestamp: Date;
      eventType: string;
      userId?: string | null;
      oldValue?: unknown;
      newValue?: unknown;
      metadata?: unknown;
      user?: { name?: string | null } | null;
    }
  | {
      kind: "interaction";
      id: string;
      timestamp: Date;
      eventType: string;
      source: string;
      channel?: string | null;
      note?: string | null;
      createdByUserId?: string | null;
      metadata?: unknown;
      createdByUser?: { name?: string | null } | null;
    };

export function InteractionsTab({ responseId }: InteractionsTabProps) {
  const { workspace } = useWorkspace();
  const orpc = useORPC();

  const { data: items, isLoading } = useQuery(
    orpc.vacancy.responses.listInteractions.queryOptions({
      input: {
        responseId,
        workspaceId: workspace?.id ?? "",
      },
      enabled: !!workspace?.id,
    }),
  );

  const timelineItems = (items ?? []) as TimelineItem[];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={`interactions-skeleton-${index}-${Date.now()}`}
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Хронология взаимодействий</h3>
        <AddInteractionDialog
          responseId={responseId}
          workspaceId={workspace?.id ?? ""}
        />
      </div>

      {timelineItems.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/20 text-center py-12 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Добавьте первое взаимодействие</p>
          <AddInteractionDialog
            responseId={responseId}
            workspaceId={workspace?.id ?? ""}
            trigger={
              <Button variant="outline" size="sm" className="mt-3">
                Добавить
              </Button>
            }
          />
        </div>
      ) : (
        <ScrollArea className="h-[500px] pr-4">
          <div className="relative space-y-4">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

            {timelineItems.map((event) => {
              const isHistory = event.kind === "history";
              const icons = isHistory ? HISTORY_ICONS : INTERACTION_ICONS;
              const labels = isHistory ? HISTORY_LABELS : INTERACTION_LABELS;
              const Icon = icons[event.eventType] ?? Clock;
              const label = labels[event.eventType] ?? event.eventType;

              return (
                <div key={event.id} className="relative flex gap-4 pl-0">
                  <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-primary shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>

                  <div className="flex-1 pb-4">
                    <div className="rounded-lg border bg-card p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-semibold">{label}</h4>
                          {event.kind === "interaction" && event.channel && (
                            <Badge variant="secondary" className="text-xs">
                              {CHANNEL_LABELS[event.channel] ?? event.channel}
                            </Badge>
                          )}
                          {event.kind === "interaction" &&
                            event.source === "manual" && (
                              <Badge variant="outline" className="text-xs">
                                Вручную
                              </Badge>
                            )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(event.timestamp), {
                            addSuffix: true,
                            locale: ru,
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground mb-2">
                        {format(
                          new Date(event.timestamp),
                          "d MMMM yyyy, HH:mm",
                          {
                            locale: ru,
                          },
                        )}
                      </p>

                      {(event.kind === "history"
                        ? event.userId
                        : event.createdByUser?.name) && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {event.kind === "history"
                            ? `Пользователь: ${event.userId}`
                            : `Добавил: ${event.createdByUser?.name ?? event.createdByUserId}`}
                        </p>
                      )}

                      {event.kind === "interaction" && event.note && (
                        <p className="text-sm mt-2 p-2 rounded bg-muted/50">
                          {event.note}
                        </p>
                      )}

                      {event.kind === "history" && (
                        <ValueChangeDisplay
                          oldValue={
                            event.oldValue as JsonValue | null | undefined
                          }
                          newValue={
                            event.newValue as JsonValue | null | undefined
                          }
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
