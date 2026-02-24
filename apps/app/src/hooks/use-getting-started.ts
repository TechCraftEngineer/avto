"use client";

import { paths } from "@qbs-autonaim/config";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useWorkspaces } from "~/contexts/workspace-context";
import { useORPC } from "~/orpc/react";

const CHROME_EXTENSION_URL =
  "https://chromewebstore.google.com/detail/recruitment-assistant";

export interface GettingStartedStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  href: string;
  external?: boolean;
  action?: () => void;
}

export function useGettingStarted() {
  const orpc = useORPC();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspaces();

  // Получаем личные интеграции (Google Calendar — на уровне аккаунта)
  const { data: userIntegrations, isLoading: isLoadingIntegrations } = useQuery(
    orpc.userIntegration.list.queryOptions(),
  );

  // Получаем список вакансий
  const { data: vacancies, isLoading: isLoadingVacancies } = useQuery(
    orpc.vacancy.list.queryOptions({
      input: { workspaceId: workspace?.id ?? "" },
      enabled: !!workspace?.id,
    }),
  );

  // Получаем Telegram сессии
  const { data: sessions, isLoading: isLoadingSessions } = useQuery(
    orpc.telegram.getSessions.queryOptions({
      input: {
        workspaceId: workspace?.id ?? "",
      },
      enabled: !!workspace?.id,
    }),
  );

  // Мутация для обновления статуса онбординга
  const updateOnboardingMutation = useMutation(
    orpc.bot.updateOnboarding.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.bot.get.queryKey({
            input: { workspaceId: workspace?.id ?? "" },
          }),
        });
      },
      onError: (error) => {
        console.error("Failed to update onboarding status:", error);
      },
    }),
  );

  // Проверяем localStorage для скрытия виджета
  const getLocalStorageKey = () => `gettingStartedDismissed_${workspace?.id}`;

  const isLocallyDismissed = () => {
    if (typeof window === "undefined" || !workspace?.id || !window.localStorage)
      return false;
    try {
      return localStorage.getItem(getLocalStorageKey()) === "true";
    } catch (error) {
      console.warn("Failed to read dismiss state from localStorage:", error);
      return false;
    }
  };

  const isLoading =
    isLoadingIntegrations || isLoadingVacancies || isLoadingSessions;

  // Состояние «установил расширение» — при клике помечаем шаг выполненным
  const [extensionMarkedInstalled, setExtensionMarkedInstalled] =
    useState(false);
  const getExtensionStorageKey = () =>
    `chromeExtensionInstalled_${workspace?.id}`;
  const isExtensionMarkedInstalled = () => {
    if (extensionMarkedInstalled) return true;
    if (typeof window === "undefined" || !workspace?.id || !window.localStorage)
      return false;
    try {
      return localStorage.getItem(getExtensionStorageKey()) === "true";
    } catch {
      return false;
    }
  };

  // Определяем шаги онбординга
  const steps: GettingStartedStep[] = [
    {
      id: "create-vacancy",
      title: "Создать первую вакансию",
      description: "Добавьте вакансию для поиска кандидатов",
      href: paths.workspace.createVacancy(
        workspace?.organizationSlug || "",
        workspace?.slug || "",
      ),
      completed: !!(vacancies && vacancies.length > 0),
    },
    {
      id: "chrome-extension",
      title: "Установить Chrome extension",
      description:
        "Расширение «Помощник рекрутера» для загрузки откликов с HH.ru",
      href: CHROME_EXTENSION_URL,
      external: true,
      completed: isExtensionMarkedInstalled(),
      action: () => {
        window.open(CHROME_EXTENSION_URL, "_blank", "noopener,noreferrer");
        if (workspace?.id && typeof window !== "undefined") {
          try {
            localStorage.setItem(getExtensionStorageKey(), "true");
          } catch {
            // ignore
          }
          setExtensionMarkedInstalled(true);
        }
      },
    },
    {
      id: "google-calendar",
      title: "Настроить Google Calendar",
      description: "Подключите календарь для планирования встреч с кандидатами",
      href: paths.account.integrations,
      completed: !!userIntegrations?.some((i) => i.type === "google_calendar"),
    },
   

    {
      id: "telegram-setup",
      title: "Настроить Telegram",
      description: "Подключите бота для уведомлений и интервью",
      href: paths.workspace.settings.telegram(
        workspace?.organizationSlug || "",
        workspace?.slug || "",
      ),
      completed: !!(
        sessions &&
        sessions.length > 0 &&
        !sessions.some((s) => s.authError)
      ),
    },
  ];

  const completedSteps = steps.filter((step) => step.completed).length;
  const totalSteps = steps.length;
  const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

  // Определяем, показывать ли виджет
  const shouldShowWidget =
    !isLoading &&
    !!workspace?.id &&
    !isLocallyDismissed() &&
    progressPercentage < 100;

  // Функции для управления виджетом
  const dismissWidget = (forever = false) => {
    if (!workspace?.id) return;

    if (forever) {
      // Сохраняем в БД
      updateOnboardingMutation.mutate({
        workspaceId: workspace.id,
        dismissedGettingStarted: true,
      });
    } else {
      // Сохраняем только в localStorage
      try {
        localStorage.setItem(getLocalStorageKey(), "true");
      } catch (error) {
        console.warn("Failed to save dismiss state to localStorage:", error);
      }
    }
  };

  const markOnboardingCompleted = () => {
    if (!workspace?.id) return;

    updateOnboardingMutation.mutate({
      workspaceId: workspace.id,
      onboardingCompleted: true,
      dismissedGettingStarted: true,
    });
  };

  return {
    steps,
    completedSteps,
    totalSteps,
    progressPercentage,
    shouldShowWidget,
    isLoading,
    dismissWidget,
    markOnboardingCompleted,
    isUpdating: updateOnboardingMutation.isPending,
  };
}
