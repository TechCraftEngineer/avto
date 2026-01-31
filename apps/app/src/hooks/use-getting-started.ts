"use client";

import { paths } from "@qbs-autonaim/config";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkspaces } from "~/contexts/workspace-context";
import { useTRPC } from "~/trpc/react";

export interface GettingStartedStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  href: string;
  action?: () => void;
}

export function useGettingStarted() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspaces();

  // Получаем настройки бота
  const { data: botSettings, isLoading: isLoadingBot } = useQuery({
    ...trpc.bot.get.queryOptions({ workspaceId: workspace?.id ?? "" }),
    enabled: !!workspace?.id,
  });

  // Получаем список вакансий
  const { data: vacancies, isLoading: isLoadingVacancies } = useQuery({
    ...trpc.vacancy.list.queryOptions({ workspaceId: workspace?.id ?? "" }),
    enabled: !!workspace?.id,
  });

  // Получаем список интеграций
  const { data: integrations, isLoading: isLoadingIntegrations } = useQuery({
    ...trpc.integration.list.queryOptions({ workspaceId: workspace?.id ?? "" }),
    enabled: !!workspace?.id,
  });

  // Получаем Telegram сессии
  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    ...trpc.telegram.getSessions.queryOptions({
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id,
  });

  // Мутация для обновления статуса онбординга
  const updateOnboardingMutation = useMutation(
    trpc.bot.updateOnboarding.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.bot.get.queryKey({
            workspaceId: workspace?.id ?? "",
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
    isLoadingBot ||
    isLoadingVacancies ||
    isLoadingIntegrations ||
    isLoadingSessions;

  // Определяем шаги онбординга
  const steps: GettingStartedStep[] = [
    {
      id: "bot-setup",
      title: "Настроить бота",
      description: "Добавьте название, описание и настройки бота",
      href: paths.workspace.settings.bot(
        workspace?.organizationSlug || "",
        workspace?.slug || "",
      ),
      completed: !!(
        botSettings?.companyName && botSettings.companyName !== "Моя компания"
      ),
    },
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
      id: "hh-integration",
      title: "Подключить HH.ru",
      description: "Интегрируйтесь с HeadHunter для автоматического поиска",
      href: paths.workspace.settings.integrations(
        workspace?.organizationSlug || "",
        workspace?.slug || "",
      ),
      completed: !!integrations?.some((i) => i.type === "hh"),
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
    workspace?.id &&
    !botSettings && // Remove dismissedGettingStarted check since it doesn't exist in schema
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
