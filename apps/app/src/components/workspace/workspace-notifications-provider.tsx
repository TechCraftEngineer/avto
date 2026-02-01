"use client";

import { useWorkspaceNotifications } from "~/hooks/use-workspace-notifications";

interface WorkspaceNotificationsProviderProps {
  workspaceId: string;
  children: React.ReactNode;
}

/**
 * Провайдер для realtime уведомлений workspace
 * Автоматически показывает toast уведомления при получении событий
 * Должен быть размещён на уровне layout workspace
 */
export function WorkspaceNotificationsProvider({
  workspaceId,
  children,
}: WorkspaceNotificationsProviderProps) {
  // Подключаем realtime уведомления
  useWorkspaceNotifications(workspaceId);

  return <>{children}</>;
}
