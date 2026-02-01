"use client";

import { useQuery } from "@tanstack/react-query";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

interface RecentChatsProps {
  workspaceSlug: string;
  orgSlug: string;
}

export function RecentChats({
  workspaceSlug: _workspaceSlug,
  orgSlug: _orgSlug,
}: RecentChatsProps) {
  const trpc = useTRPC();
  const { workspace } = useWorkspace();

  // Получаем последние сообщения с помощью queryOptions
  const recentMessagesQueryOptions =
    trpc.telegram.messages.getRecent.queryOptions({
      limit: 5,
      workspaceId: workspace?.id ?? "",
    });

  const { data: recentMessages = [], isPending } = useQuery(
    recentMessagesQueryOptions,
  );

  if (isPending) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Последние чаты</h2>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-2" />
          <p className="text-sm">Загрузка…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Последние чаты</h2>
      </div>

      <div className="grid gap-3">
        {recentMessages.map((message) => (
          <div
            key={message.id}
            className="p-3 rounded-lg border bg-card text-card-foreground"
          >
            <p className="text-sm text-muted-foreground truncate">
              {message.content}
            </p>
          </div>
        ))}
      </div>

      {recentMessages.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Нет активных чатов</p>
        </div>
      )}
    </div>
  );
}
