"use client";

import { useInngestSubscription } from "@inngest/realtime/hooks";
import { useEffect } from "react";
import { toast } from "sonner";
import { fetchWorkspaceNotificationsToken } from "~/actions/realtime";

interface NotificationData {
  workspaceId: string;
  type?: "hh-auth-failed" | "telegram-auth-failed" | "api-error" | "rate-limit";
  taskType?: "import" | "screening" | "resume-parsing" | "sync" | "update";
  message: string;
  severity?: "error" | "warning" | "info";
  success?: boolean;
}

/**
 * Хук для realtime уведомлений workspace
 * Автоматически показывает toast уведомления при получении событий
 */
export function useWorkspaceNotifications(workspaceId: string | undefined) {
  const { latestData, state } = useInngestSubscription({
    refreshToken: () => fetchWorkspaceNotificationsToken(workspaceId!),
    enabled: Boolean(workspaceId),
  });

  useEffect(() => {
    if (!latestData) return;

    const data = latestData.data as NotificationData;
    const topic = latestData.topic;

    if (topic === "integration-error") {
      const severity = data.severity || "error";

      if (severity === "error") {
        toast.error(data.message, {
          description: getErrorDescription(data.type),
          duration: 8000,
        });
      } else if (severity === "warning") {
        toast.warning(data.message, {
          duration: 6000,
        });
      } else {
        toast.info(data.message, {
          duration: 4000,
        });
      }
    } else if (topic === "task-completed") {
      if (data.success) {
        toast.success(data.message, {
          description: getTaskDescription(data.taskType),
          duration: 4000,
        });
      } else {
        toast.error(data.message, {
          description: "Задача завершилась с ошибкой",
          duration: 6000,
        });
      }
    }
  }, [latestData]);

  return {
    isConnected: state === "active",
  };
}

function getErrorDescription(
  type?: "hh-auth-failed" | "telegram-auth-failed" | "api-error" | "rate-limit",
): string {
  switch (type) {
    case "hh-auth-failed":
      return "Требуется повторная авторизация на HeadHunter";
    case "telegram-auth-failed":
      return "Проверьте настройки Telegram бота";
    case "rate-limit":
      return "Превышен лимит запросов, повторите позже";
    case "api-error":
      return "Ошибка при обращении к внешнему API";
    default:
      return "Проверьте настройки интеграции";
  }
}

function getTaskDescription(
  taskType?: "import" | "screening" | "resume-parsing" | "sync" | "update",
): string {
  switch (taskType) {
    case "import":
      return "Вакансии успешно импортированы";
    case "screening":
      return "Оценка откликов завершена";
    case "resume-parsing":
      return "Резюме обработаны";
    case "sync":
      return "Синхронизация завершена";
    case "update":
      return "Обновление завершено";
    default:
      return "Задача выполнена";
  }
}
