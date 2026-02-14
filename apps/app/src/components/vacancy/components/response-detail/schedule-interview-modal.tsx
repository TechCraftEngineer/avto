"use client";

import { Badge } from "@qbs-autonaim/ui";
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
import { CalendarIcon, Clock, MapPin, Users } from "lucide-react";
import { useState } from "react";
import type { VacancyResponse } from "./types";

interface ScheduleInterviewModalProps {
  response: VacancyResponse;
}

export function ScheduleInterviewModal({
  response,
}: ScheduleInterviewModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [interviewType, setInterviewType] = useState<string>();
  const [location, setLocation] = useState<string>();
  const [notes, setNotes] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock доступные временные слоты
  const availableSlots = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ];

  // Mock занятые слоты (для демонстрации)
  const busySlots = ["10:00", "15:00"];

  const handleScheduleInterview = async () => {
    if (!selectedDate || !selectedTime || !interviewType) return;

    setIsSubmitting(true);

    // Имитация API вызова
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Здесь будет реальный API вызов для создания события в календаре
    console.log("Scheduling interview:", {
      candidateId: response.id,
      candidateName: response.candidateName,
      date: selectedDate,
      time: selectedTime,
      type: interviewType,
      location,
      notes,
    });

    setIsSubmitting(false);
    // Закрыть модальное окно и показать уведомление
    alert(
      `Собеседование запланировано на ${selectedDate.toLocaleDateString("ru-RU")} в ${selectedTime}`,
    );
  };

  const isSlotAvailable = (time: string) => !busySlots.includes(time);
  const isFormValid = selectedDate && selectedTime && interviewType;

  return (
    <Dialog>
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
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
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
                  {availableSlots.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      size="sm"
                      disabled={!isSlotAvailable(time)}
                      onClick={() => setSelectedTime(time)}
                      className="h-8"
                    >
                      {time}
                      {!isSlotAvailable(time) && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          Занято
                        </Badge>
                      )}
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
                  <strong>Тип:</strong> {interviewType}
                </p>
                {location && (
                  <p>
                    <strong>Место:</strong> {location}
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

          {/* Кнопки действий */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleScheduleInterview}
              disabled={!isFormValid || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Планируется..." : "Запланировать собеседование"}
            </Button>
            <Button variant="outline" className="flex-1">
              Добавить в календарь
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
