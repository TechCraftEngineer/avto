"use client";

import { Badge } from "@qbs-autonaim/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/card";
import { skipToken, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  User,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useTRPC } from "~/trpc/react";
import type { VacancyResponse } from "./types";

interface StatusTimelineProps {
  response: VacancyResponse;
}

// Типы событий в timeline
interface TimelineEvent {
  id: string;
  type: "status_change" | "message" | "interview" | "evaluation" | "note";
  title: string;
  description: string;
  timestamp: Date;
  icon: React.ElementType;
  color: string;
  metadata?: Record<string, any>;
}

export function StatusTimeline({ response }: StatusTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const trpc = useTRPC();
  const { workspaceId } = useWorkspaceContext();

  // Получаем реальную историю событий
  const { data: historyData } = useQuery(
    trpc.vacancy.responses.history.queryOptions(
      workspaceId
        ? {
            responseId: response.id,
            workspaceId,
          }
        : skipToken,
    ),
  );

  // Функция для получения иконки по типу события
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "CREATED":
        return User;
      case "STATUS_CHANGED":
      case "HR_STATUS_CHANGED":
        return Briefcase;
      case "MESSAGE":
      case "WELCOME_SENT":
      case "OFFER_SENT":
        return MessageSquare;
      case "INTERVIEW_STARTED":
      case "INTERVIEW_COMPLETED":
        return Calendar;
      case "SCREENING_COMPLETED":
        return CheckCircle2;
      case "RESUME_UPDATED":
        return FileText;
      case "PHONE_ADDED":
        return Phone;
      case "EMAIL_ADDED":
        return Mail;
      case "COMMENT_ADDED":
        return MessageSquare;
      default:
        return Clock;
    }
  };

  // Функция для получения цвета по типу события
  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "CREATED":
        return "text-blue-600";
      case "STATUS_CHANGED":
      case "HR_STATUS_CHANGED":
        return "text-indigo-600";
      case "SCREENING_COMPLETED":
      case "INTERVIEW_COMPLETED":
        return "text-green-600";
      case "MESSAGE":
      case "WELCOME_SENT":
      case "OFFER_SENT":
      case "COMMENT_ADDED":
        return "text-purple-600";
      case "INTERVIEW_STARTED":
        return "text-orange-600";
      case "RESUME_UPDATED":
      case "PHONE_ADDED":
      case "EMAIL_ADDED":
        return "text-cyan-600";
      default:
        return "text-gray-600";
    }
  };

  // Функция для получения заголовка события
  const getEventTitle = (eventType: string, oldValue?: any, newValue?: any) => {
    switch (eventType) {
      case "CREATED":
        return "Отклик создан";
      case "STATUS_CHANGED":
        return `Статус изменен на ${newValue || "неизвестный"}`;
      case "HR_STATUS_CHANGED":
        return `HR статус изменен на ${newValue || "неизвестный"}`;
      case "WELCOME_SENT":
        return "Приветственное сообщение отправлено";
      case "OFFER_SENT":
        return "Предложение отправлено";
      case "SCREENING_COMPLETED":
        return "Скрининг завершен";
      case "INTERVIEW_STARTED":
        return "Собеседование начато";
      case "INTERVIEW_COMPLETED":
        return "Собеседование завершено";
      case "RESUME_UPDATED":
        return "Резюме обновлено";
      case "PHONE_ADDED":
        return "Телефон добавлен";
      case "EMAIL_ADDED":
        return "Email добавлен";
      case "COMMENT_ADDED":
        return "Комментарий добавлен";
      case "SALARY_UPDATED":
        return "Зарплата обновлена";
      default:
        return eventType.replace(/_/g, " ").toLowerCase();
    }
  };

  // Преобразуем данные истории в TimelineEvent
  const events: TimelineEvent[] = historyData
    ? historyData.map((event) => ({
        id: event.id,
        type: event.eventType.toLowerCase().includes("status")
          ? ("status_change" as const)
          : event.eventType.toLowerCase().includes("message") ||
              event.eventType.toLowerCase().includes("sent")
            ? ("message" as const)
            : event.eventType.toLowerCase().includes("interview")
              ? ("interview" as const)
              : event.eventType.toLowerCase().includes("screening") ||
                  event.eventType.toLowerCase().includes("evaluation")
                ? ("evaluation" as const)
                : ("note" as const),
        title: getEventTitle(event.eventType, event.oldValue, event.newValue),
        description: `Изменение: ${event.oldValue || "—"} → ${event.newValue || "—"}`,
        timestamp: event.createdAt,
        icon: getEventIcon(event.eventType),
        color: getEventColor(event.eventType),
        metadata: {
          userId: event.userId,
          oldValue: event.oldValue,
          newValue: event.newValue,
        },
      }))
    : [];

  // Добавляем событие создания отклика, если его нет в истории
  if (!events.some((e) => e.type === "note" && e.title.includes("создан"))) {
    events.push({
      id: "created",
      type: "note",
      title: "Отклик получен",
      description: "Кандидат откликнулся на вакансию",
      timestamp: response.respondedAt || response.createdAt,
      icon: User,
      color: "text-blue-600",
    });
  }

  // Сортируем по времени (новые сверху)
  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const displayedEvents = isExpanded ? events : events.slice(0, 3);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "NEW":
        return "Новый";
      case "EVALUATED":
        return "Оценен";
      case "INTERVIEW":
        return "Собеседование";
      case "NEGOTIATION":
        return "Переговоры";
      case "COMPLETED":
        return "Завершен";
      case "SKIPPED":
        return "Пропущен";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-blue-100 text-blue-800";
      case "EVALUATED":
        return "bg-yellow-100 text-yellow-800";
      case "INTERVIEW":
        return "bg-purple-100 text-purple-800";
      case "NEGOTIATION":
        return "bg-orange-100 text-orange-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "SKIPPED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Только что";
    if (diffMinutes < 60) return `${diffMinutes} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} д. назад`;

    return date.toLocaleDateString("ru-RU");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            История взаимодействия
          </CardTitle>
          <Badge variant="outline" className={getStatusColor(response.status)}>
            {getStatusLabel(response.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timeline */}
        <div className="space-y-4">
          {displayedEvents.map((event, index) => {
            const Icon = event.icon;
            return (
              <div key={event.id} className="flex gap-4">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                      index === 0 ? "border-current" : "border-muted"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${event.color}`} />
                  </div>
                  {index < displayedEvents.length - 1 && (
                    <div className="h-8 w-px bg-muted" />
                  )}
                </div>

                {/* Event content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{event.title}</h4>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(event.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {event.description}
                  </p>

                  {/* Additional metadata */}
                  {event.metadata && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {event.metadata.score && (
                        <Badge variant="secondary" className="text-xs">
                          Оценка: {event.metadata.score}%
                        </Badge>
                      )}
                      {event.metadata.date && event.metadata.time && (
                        <Badge variant="outline" className="text-xs">
                          {event.metadata.date} в {event.metadata.time}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Show more/less button */}
        {events.length > 3 && (
          <div className="pt-2 border-t">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-primary hover:underline"
            >
              {isExpanded
                ? "Показать меньше"
                : `Показать еще ${events.length - 3} событий`}
            </button>
          </div>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {events.length}
            </div>
            <div className="text-xs text-muted-foreground">Событий</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {events.filter((e) => e.type === "message").length}
            </div>
            <div className="text-xs text-muted-foreground">Сообщений</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {events.filter((e) => e.type === "interview").length}
            </div>
            <div className="text-xs text-muted-foreground">Собеседований</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              {Math.floor(
                (new Date().getTime() -
                  (response.respondedAt?.getTime() || Date.now())) /
                  (1000 * 60 * 60 * 24),
              )}
            </div>
            <div className="text-xs text-muted-foreground">Дней прошло</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
