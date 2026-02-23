"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import { Input } from "@qbs-autonaim/ui/components/input";
import { Label } from "@qbs-autonaim/ui/components/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useORPC } from "~/orpc/react";

/**
 * Тип ошибки oRPC
 */
interface ORPCErrorType {
  code:
    | "BAD_REQUEST"
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "CONFLICT"
    | "TOO_MANY_REQUESTS"
    | "INTERNAL_SERVER_ERROR";
  message: string;
}

/**
 * Тип workspace из API
 */
interface Workspace {
  id: string;
  name: string;
  slug: string | null;
}

/**
 * Клиентский компонент для демонстрации использования oRPC с prefetch данными
 *
 * Демонстрирует:
 * - Использование prefetch данных с сервера (данные уже загружены)
 * - Query с useQuery и orpc.workspace.list.queryOptions()
 * - Mutation с useMutation и orpc.workspace.create.mutationOptions()
 * - Обработку ошибок с русскими сообщениями
 * - Инвалидацию кэша после мутации
 *
 * @see Requirements 5.2, 6.7, 7.2, 7.3, 7.5, 8.2, 11.3
 */
export function TestORPCClient() {
  const orpc = useORPC();
  const queryClient = useQueryClient();
  const [workspaceName, setWorkspaceName] = useState("");

  // Query: получение списка workspace
  // Данные уже prefetch на сервере, поэтому isPending будет false сразу
  const { data: workspaces, isPending: isLoadingWorkspaces } = useQuery(
    orpc.workspace.list.queryOptions(),
  );

  // Mutation: создание workspace
  const { mutate: createWorkspace, isPending: isCreating } = useMutation(
    orpc.workspace.create.mutationOptions({
      onSuccess: () => {
        // Инвалидация кэша для обновления списка
        queryClient.invalidateQueries({
          queryKey: orpc.workspace.list.queryKey(),
        });

        toast.success("Рабочее пространство создано");
        setWorkspaceName("");
      },
      onError: (error: ORPCErrorType) => {
        // Обработка различных типов ошибок с русскими сообщениями
        if (error.code === "CONFLICT") {
          toast.error("Рабочее пространство с таким именем уже существует");
        } else if (error.code === "FORBIDDEN") {
          toast.error("Нет доступа для создания рабочего пространства");
        } else if (error.code === "UNAUTHORIZED") {
          toast.error("Требуется авторизация");
        } else if (error.code === "NOT_FOUND") {
          toast.error("Организация не найдена");
        } else if (error.code === "BAD_REQUEST") {
          toast.error("Некорректные данные", {
            description: error.message,
          });
        } else {
          toast.error("Ошибка при создании рабочего пространства", {
            description: error.message,
          });
        }
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!workspaceName.trim()) {
      toast.error("Введите название рабочего пространства");
      return;
    }

    // Временное использование any для обхода проблем с типизацией oRPC
    // TODO: Исправить после обновления типов oRPC
    // biome-ignore lint/suspicious/noExplicitAny: Временное решение до обновления типов oRPC
    (createWorkspace as any)({
      workspace: {
        name: workspaceName,
        slug: workspaceName.toLowerCase().replace(/\s+/g, "-"),
      },
    });
  };

  // Type assertion для workspaces
  const workspacesList = workspaces as Workspace[] | undefined;

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Тестирование oRPC с Server-Side Prefetch</CardTitle>
          <CardDescription>
            Демонстрация работы с oRPC, TanStack Query и server-side prefetch.
            Данные загружены на сервере и переданы клиенту через
            HydrationBoundary.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Форма создания workspace */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">
                Название рабочего пространства
              </Label>
              <Input
                id="workspace-name"
                type="text"
                placeholder="Моё рабочее пространство…"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                disabled={isCreating}
                autoComplete="off"
                name="workspace-name"
              />
            </div>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Создание…
                </>
              ) : (
                "Создать рабочее пространство"
              )}
            </Button>
          </form>

          {/* Список workspace */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              Список рабочих пространств
            </h3>
            {isLoadingWorkspaces ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                <span>Загрузка…</span>
              </div>
            ) : workspacesList && workspacesList.length > 0 ? (
              <ul className="space-y-2">
                {workspacesList.map((workspace) => (
                  <li key={workspace.id} className="rounded-md border p-3">
                    <div className="font-medium">{workspace.name}</div>
                    {workspace.slug && (
                      <div className="text-sm text-muted-foreground">
                        {workspace.slug}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">Нет рабочих пространств</p>
            )}
          </div>

          {/* Информация о prefetch */}
          <div className="rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
            <h4 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
              ℹ️ Server-Side Prefetch
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Данные списка рабочих пространств были загружены на сервере и
              переданы клиенту через HydrationBoundary. Это означает, что
              пользователь видит данные мгновенно без дополнительного запроса к
              API.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
