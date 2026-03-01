"use client";

import { Badge } from "@qbs-autonaim/ui/components/badge";
import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import { ScrollArea } from "@qbs-autonaim/ui/components/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  Users,
  XCircle,
} from "lucide-react";
import {
  AddInteractionDialog,
  ValueChangeDisplay,
} from "~/components/shared/components/response-detail-tabs";
import type { JsonValue } from "~/components/shared/components/response-detail-tabs/tabs/value-change-display";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useORPC } from "~/orpc/react";
import { getStatusColor, getStatusLabel } from "./header-card-utils";
import type { VacancyResponse } from "./types";

interface StatusTimelineProps {
  response: VacancyResponse;
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

const MESSAGE_EVENT_TYPES = new Set([
  "WELCOME_SENT",
  "OFFER_SENT",
  "COMMENT_ADDED",
  "MESSAGE",
  "message_sent",
  "email_sent",
  "followup_sent",
]);
const INTERVIEW_EVENT_TYPES = new Set([
  "INTERVIEW_STARTED",
  "INTERVIEW_COMPLETED",
  "SCREENING_COMPLETED",
  "interview_scheduled",
  "interview_started",
  "interview_completed",
]);

function InteractionStats({
  timelineItems,
  respondedAt,
}: {
  timelineItems: TimelineItem[];
  respondedAt: Date;
}) {
  const totalEvents = timelineItems.length;
  const messageCount = timelineItems.filter((e) =>
    MESSAGE_EVENT_TYPES.has(e.eventType),
  ).length;
  const interviewCount = timelineItems.filter((e) =>
    INTERVIEW_EVENT_TYPES.has(e.eventType),
  ).length;
  const daysSinceResponse = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(respondedAt).getTime()) / (1000 * 60 * 60 * 24),
    ),
  );

  const stats = [
    {
      label: "Событий",
      value: totalEvents,
      icon: Clock,
    },
    {
      label: "Сообщений",
      value: messageCount,
      icon: MessageSquare,
    },
    {
      label: "Собеседований",
      value: interviewCount,
      icon: Calendar,
    },
    {
      label: "Дней с отклика",
      value: daysSinceResponse,
      icon: CalendarClock,
    },
  ] as const;

  return (
    <div className="mt-4 border-t pt-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">{label}</p>
              <p className="truncate font-semibold tabular-nums">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatusTimeline({ response }: StatusTimelineProps) {
  const orpc = useORPC();
  const { workspaceId } = useWorkspaceContext();

  const {
    data: items,
    isLoading,
    isError,
    error,
  } = useQuery(
    orpc.vacancy.responses.listInteractions.queryOptions({
      input: {
        responseId: response.id,
        workspaceId: workspaceId ?? "",
      },
      enabled: !!workspaceId,
    }),
  );

  const timelineItems = (items ?? []) as TimelineItem[];

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">История взаимодействия</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center"
            role="alert"
            aria-live="polite"
            aria-atomic="true"
          >
            <XCircle className="mx-auto mb-3 h-12 w-12 text-destructive opacity-50" />
            <p className="text-sm font-medium text-destructive">
              Не удалось загрузить хронологию
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {error instanceof Error ? error.message : "Неизвестная ошибка"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-lg">История взаимодействия</CardTitle>
            <Badge
              variant="outline"
              className={getStatusColor(response.status)}
            >
              {getStatusLabel(response.status)}
            </Badge>
          </div>
          <AddInteractionDialog
            responseId={response.id}
            workspaceId={workspaceId ?? ""}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[
              "skeleton-1",
              "skeleton-2",
              "skeleton-3",
              "skeleton-4",
              "skeleton-5",
            ].map((id) => (
              <div key={id} className="flex gap-3 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : timelineItems.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/20 py-12 text-center text-muted-foreground">
            <Clock className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p className="text-sm">Добавьте первое взаимодействие</p>
            <AddInteractionDialog
              responseId={response.id}
              workspaceId={workspaceId ?? ""}
              trigger={
                <Button variant="outline" size="sm" className="mt-3">
                  Добавить
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <ScrollArea className="h-[500px] pr-4">
              <div className="relative space-y-4">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

                {timelineItems.map((event) => {
                  const isHistory = event.kind === "history";
                  const icons = isHistory ? HISTORY_ICONS : INTERACTION_ICONS;
                  const labels = isHistory
                    ? HISTORY_LABELS
                    : INTERACTION_LABELS;
                  const Icon = icons[event.eventType] ?? Clock;
                  const label = labels[event.eventType] ?? event.eventType;

                  return (
                    <div key={event.id} className="relative flex gap-4 pl-0">
                      <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>

                      <div className="flex-1 pb-4">
                        <div className="rounded-lg border bg-card p-4">
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-semibold">{label}</h4>
                              {event.kind === "interaction" &&
                                event.channel && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {CHANNEL_LABELS[event.channel] ??
                                      event.channel}
                                  </Badge>
                                )}
                              {event.kind === "interaction" &&
                                event.source === "manual" && (
                                  <Badge variant="outline" className="text-xs">
                                    Вручную
                                  </Badge>
                                )}
                            </div>
                            <span className="whitespace-nowrap text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(event.timestamp), {
                                addSuffix: true,
                                locale: ru,
                              })}
                            </span>
                          </div>

                          <p className="mb-2 text-xs text-muted-foreground">
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
                            <p className="mb-2 text-xs text-muted-foreground">
                              {event.kind === "history"
                                ? `Пользователь: ${event.userId}`
                                : `Добавил: ${event.createdByUser?.name ?? event.createdByUserId}`}
                            </p>
                          )}

                          {event.kind === "interaction" && event.note && (
                            <p className="mt-2 rounded bg-muted/50 p-2 text-sm">
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

            {/* Статистика взаимодействия */}
            <InteractionStats
              timelineItems={timelineItems}
              respondedAt={response.respondedAt ?? response.createdAt}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
