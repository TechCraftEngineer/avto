"use client";

import type { Realtime } from "@inngest/realtime";
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
  externalId: string;
  title: string;
  responses: string;
  views: string;
  region: string;
}

interface ArchivedVacanciesSelectorProps {
  fetchToken: () => Promise<Realtime.Subscribe.Token>;
  onSelect: (selectedIds: string[]) => void;
  onCancel: () => void;
}

export function ArchivedVacanciesSelector({
  fetchToken,
  onSelect,
  onCancel,
}: ArchivedVacanciesSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Подписываемся на канал Realtime
  const { data, error } = useInngestSubscription({
    refreshToken: fetchToken,
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

  const toggleVacancy = (externalId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(externalId)) {
        newSet.delete(externalId);
      } else {
        newSet.add(externalId);
      }
      return newSet;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === vacancies.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(vacancies.map((v) => v.externalId)));
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
              key={vacancy.externalId}
              className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
            >
              <Checkbox
                id={vacancy.externalId}
                checked={selectedIds.has(vacancy.externalId)}
                onCheckedChange={() => toggleVacancy(vacancy.externalId)}
                className="mt-1"
              />
              <label
                htmlFor={vacancy.externalId}
                className="flex-1 cursor-pointer space-y-1"
              >
                <div className="font-medium leading-none">{vacancy.title}</div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {vacancy.region && <span>{vacancy.region}</span>}
                  {vacancy.responses && (
                    <span>Откликов: {vacancy.responses}</span>
                  )}
                  {vacancy.views && <span>Просмотров: {vacancy.views}</span>}
                </div>
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
