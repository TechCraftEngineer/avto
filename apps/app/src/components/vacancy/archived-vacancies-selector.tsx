"use client";

import { useInngestSubscription } from "@inngest/realtime/hooks";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Checkbox,
  ScrollArea,
} from "@qbs-autonaim/ui";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";

interface ArchivedVacancy {
  id: string;
  title: string;
  archivedAt?: string;
}

interface ArchivedVacanciesSelectorProps {
  workspaceId: string;
  requestId: string;
  onSelect: (selectedIds: string[]) => void;
  onCancel: () => void;
}

export function ArchivedVacanciesSelector({
  workspaceId,
  requestId,
  onSelect,
  onCancel,
}: ArchivedVacanciesSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Подписываемся на выполнение функции через Realtime API
  const { data, error } = useInngestSubscription({
    refreshToken: async () => {
      // Получаем токен для конкретного requestId
      const response = await fetch("/api/inngest/realtime-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          requestId,
          type: "fetch-archived-list",
        }),
      });

      if (!response.ok) {
        throw new Error("Не удалось получить токен подписки");
      }

      return response.json();
    },
    enabled: true,
  });

  // Получаем последнее сообщение
  const latestMessage = data[data.length - 1];
  const isCompleted = latestMessage?.topic === "result";
  const isLoading = !isCompleted && !error;

  const vacancies: ArchivedVacancy[] =
    latestMessage?.topic === "result" && latestMessage.data?.vacancies
      ? (latestMessage.data.vacancies as ArchivedVacancy[])
      : [];

  const toggleVacancy = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === vacancies.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(vacancies.map((v) => v.id)));
    }
  };

  const handleConfirm = () => {
    onSelect(Array.from(selectedIds));
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Ошибка загрузки</AlertTitle>
        <AlertDescription>
          Не удалось получить список архивных вакансий. Попробуйте позже.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Alert>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Загрузка списка вакансий</AlertTitle>
        <AlertDescription>
          Получаем список архивных вакансий с HeadHunter...
        </AlertDescription>
      </Alert>
    );
  }

  if (vacancies.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Архивные вакансии не найдены</AlertTitle>
        <AlertDescription>
          У вас нет архивных вакансий на HeadHunter.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">
            Выберите вакансии для импорта
          </h3>
          <p className="text-sm text-muted-foreground">
            Найдено архивных вакансий: {vacancies.length}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={toggleAll}>
          {selectedIds.size === vacancies.length ? "Снять все" : "Выбрать все"}
        </Button>
      </div>

      <ScrollArea className="h-[400px] rounded-md border p-4">
        <div className="space-y-3">
          {vacancies.map((vacancy) => (
            <div
              key={vacancy.id}
              className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
            >
              <Checkbox
                id={vacancy.id}
                checked={selectedIds.has(vacancy.id)}
                onCheckedChange={() => toggleVacancy(vacancy.id)}
                className="mt-1"
              />
              <label
                htmlFor={vacancy.id}
                className="flex-1 cursor-pointer space-y-1"
              >
                <div className="font-medium leading-none">{vacancy.title}</div>
                {vacancy.archivedAt && (
                  <div className="text-sm text-muted-foreground">
                    Архивирована:{" "}
                    {new Date(vacancy.archivedAt).toLocaleDateString("ru-RU")}
                  </div>
                )}
              </label>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-muted-foreground">
          Выбрано: {selectedIds.size} из {vacancies.length}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button onClick={handleConfirm} disabled={selectedIds.size === 0}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Импортировать выбранные ({selectedIds.size})
          </Button>
        </div>
      </div>
    </div>
  );
}
