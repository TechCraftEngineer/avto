"use client";

import { Button } from "@qbs-autonaim/ui";
import { Calendar } from "@qbs-autonaim/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@qbs-autonaim/ui";
import { Label } from "@qbs-autonaim/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@qbs-autonaim/ui";
import { Textarea } from "@qbs-autonaim/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarIcon, Clock, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";
import type { VacancyResponse } from "./types";

interface ScheduleInterviewModalProps {
  response: VacancyResponse;
}

const AVAILABLE_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  technical: "Техническое",
  hr: "HR собеседование",
  final: "Финальное",
  phone: "По телефону",
  video: "Видео звонок",
};

const LOCATION_LABELS: Record<string, string> = {
  office: "Офис",
  zoom: "Zoom",
  "google-meet": "Google Meet",
  phone: "По телефону",
  remote: "Удалённо",
};

export function ScheduleInterviewModal({
  response,
}: ScheduleInterviewModalProps) {
  const trpc = useTRPC();
  const { workspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [interviewType, setInterviewType] = useState<string>("video");
  const [location, setLocation] = useState<string>();
  const [notes, setNotes] = useState<string>();

  const workspaceId = (response as { workspaceId?: string }).workspaceId ?? workspace?.id ?? "";

  const { data: userIntegrations } = useQuery(
    trpc.userIntegration.list.queryOptions(),
  );

  const hasGoogleCalendar = userIntegrations?.some(
    (i) => i.type === "google_calendar",
  );

  const createEventMutation = useMutation(
    trpc.calendar.createEvent.mutationOptions({
      onSuccess: (data) => {
        toast.success("Событие добавлено в календарь", {
          action: data.htmlLink
            ? {
                label: "Открыть",
                onClick: () => window.open(data.htmlLink, "_blank"),
              }
            : undefined,
        });
        setOpen(false);
        setSelectedDate(undefined);
        setSelectedTime(undefined);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleScheduleInterview = () => {
    if (!selectedDate || !selectedTime || !interviewType || !workspaceId) return;

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const scheduledAt = new Date(selectedDate);
    scheduledAt.setHours(hours, minutes, 0, 0);

    const typeLabel = INTERVIEW_TYPE_LABELS[interviewType] ?? interviewType;
    const candidateName = response.candidateName ?? "Кандидат";
    const title = `${typeLabel}: ${candidateName}`;

    let description = notes ?? "";
    if (location) {
      description += `\nМесто: ${LOCATION_LABELS[location] ?? location}`;
    }

    createEventMutation.mutate({
      responseId: response.id,
      workspaceId,
      scheduledAt,
      durationMinutes: 60,
      title,
      description: description.trim() || undefined,
      type: interviewType as "technical" | "hr" | "final" | "phone" | "video",
    });
  };

  const isFormValid = selectedDate && selectedTime && interviewType;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CalendarIcon className="h-4 w-4" />
          Запланировать интервью
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto min-w-fit">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Запланировать собеседование
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Информация о кандидате */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium mb-2">Кандидат</h3>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium">
                  {response.candidateName || "Кандидат"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {response.salaryExpectationsAmount
                    ? `${response.salaryExpectationsAmount.toLocaleString()} ₽`
                    : "Зарплата не указана"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Выбор даты */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Выберите дату
              </Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </div>

            {/* Выбор времени и типа */}
            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4" />
                  Выберите время
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_SLOTS.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTime(time)}
                      className="h-8"
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Тип собеседования</Label>
                <Select value={interviewType} onValueChange={setInterviewType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Техническое</SelectItem>
                    <SelectItem value="hr">HR собеседование</SelectItem>
                    <SelectItem value="final">Финальное</SelectItem>
                    <SelectItem value="phone">По телефону</SelectItem>
                    <SelectItem value="video">Видео звонок</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4" />
                  Место проведения
                </Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите место" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office">Офис (ул. Ленина, 1)</SelectItem>
                    <SelectItem value="zoom">Zoom конференция</SelectItem>
                    <SelectItem value="google-meet">Google Meet</SelectItem>
                    <SelectItem value="phone">По телефону</SelectItem>
                    <SelectItem value="remote">Удаленно</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Дополнительные заметки */}
          <div>
            <Label className="mb-2 block">Дополнительные заметки</Label>
            <Textarea
              placeholder="Подготовка, вопросы для обсуждения..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Предварительный просмотр */}
          {selectedDate && selectedTime && interviewType && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Предварительный просмотр
              </h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>
                  <strong>Дата:</strong>{" "}
                  {selectedDate.toLocaleDateString("ru-RU")}
                </p>
                <p>
                  <strong>Время:</strong> {selectedTime}
                </p>
                <p>
                  <strong>Тип:</strong>{" "}
                  {INTERVIEW_TYPE_LABELS[interviewType] ?? interviewType}
                </p>
                {location && (
                  <p>
                    <strong>Место:</strong>{" "}
                    {LOCATION_LABELS[location] ?? location}
                  </p>
                )}
                {notes && (
                  <p>
                    <strong>Заметки:</strong> {notes}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Подсказка подключить календарь */}
          {!hasGoogleCalendar && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Подключите Google Calendar в{" "}
                <Link
                  href="/account/settings/integrations"
                  className="underline font-medium"
                >
                  настройках аккаунта
                </Link>
                , чтобы добавлять собеседования в свой календарь.
              </p>
            </div>
          )}

          {/* Кнопки действий */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleScheduleInterview}
              disabled={
                !isFormValid ||
                createEventMutation.isPending ||
                !hasGoogleCalendar
              }
              className="flex-1"
            >
              {createEventMutation.isPending
                ? "Планируется..."
                : "Добавить в календарь"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
