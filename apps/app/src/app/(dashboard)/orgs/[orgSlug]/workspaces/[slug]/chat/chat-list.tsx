"use client";

import { paths } from "@qbs-autonaim/config";
import { Badge } from "@qbs-autonaim/ui/components/badge";
import { Input } from "@qbs-autonaim/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@qbs-autonaim/ui/components/select";
import { Skeleton } from "@qbs-autonaim/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useWorkspace } from "~/hooks/use-workspace";
import { useWorkspaceParams } from "~/hooks/use-workspace-params";
import { useTRPC } from "~/trpc/react";

export function ChatList() {
  const { orgSlug, slug: workspaceSlug } = useWorkspaceParams();
  const trpc = useTRPC();
  const { workspace } = useWorkspace();
  const pathname = usePathname();
  const [selectedVacancyId, setSelectedVacancyId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: vacancies = [] } = useQuery({
    ...trpc.vacancy.list.queryOptions({ workspaceId: workspace?.id ?? "" }),
    enabled: !!workspace?.id,
  });

  const {
    data: conversations = [],
    isPending,
    error,
  } = useQuery({
    ...trpc.telegram.conversation.getAll.queryOptions({
      workspaceId: workspace?.id ?? "",
      vacancyId: selectedVacancyId === "all" ? undefined : selectedVacancyId,
    }),
    enabled: !!workspace?.id,
    staleTime: 10000,
  });

  // Guard: return null if required params are missing
  if (!orgSlug || !workspaceSlug) {
    return null;
  }

  if (isPending) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b px-3 md:px-4 py-3 space-y-3">
          <Skeleton className="h-6 md:h-7 w-20 md:w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="flex-1 space-y-0">
          {Array.from({ length: 5 }, (_, index) => `skeleton-${index}`).map(
            (key) => (
              <div key={key} className="px-3 md:px-4 py-3 border-b">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28 md:w-32" />
                  <Skeleton className="h-3 w-20 md:w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed border-red-200 mx-3 md:mx-4 my-4">
        <div className="text-center px-4">
          <h2 className="text-xl md:text-2xl font-semibold mb-2 text-red-600">
            Ошибка
          </h2>
          <p className="text-sm md:text-base text-muted-foreground">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  if (!isPending && conversations.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed mx-3 md:mx-4 my-4">
        <div className="text-center px-4">
          <MessageCircle className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl md:text-2xl font-semibold mb-2">Нет чатов</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Пока нет активных диалогов с кандидатами
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-3 md:px-4 py-3 space-y-3">
        <h1 className="text-lg md:text-xl font-semibold">Чаты</h1>

        <div className="space-y-2">
          <label
            htmlFor="search-input"
            className="text-sm font-medium text-muted-foreground"
          >
            Поиск по ФИО
          </label>
          <Input
            id="search-input"
            type="text"
            placeholder="Введите имя кандидата…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="vacancy-filter"
            className="text-sm font-medium text-muted-foreground"
          >
            Фильтр по вакансии
          </label>
          <Select
            value={selectedVacancyId}
            onValueChange={setSelectedVacancyId}
          >
            <SelectTrigger id="vacancy-filter" className="w-full">
              <SelectValue placeholder="Все вакансии" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все вакансии</SelectItem>
              {vacancies.map((vacancy) => (
                <SelectItem key={vacancy.id} value={vacancy.id}>
                  {vacancy.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations
          .filter((_conversation) => {
            if (!searchQuery) return true;
            return true; // Фильтрация по имени временно отключена
          })
          .map((conversation) => {
            const lastMessage = conversation.messages[0];

            const isActive =
              pathname ===
              paths.workspace.chat(orgSlug, workspaceSlug, conversation.id);

            let vacancyTitle = null;
            if (conversation.metadata) {
              try {
                const metadata = JSON.parse(
                  conversation.metadata as unknown as string,
                );
                const vacancy = vacancies.find(
                  (v) => v.id === metadata.vacancyId,
                );
                vacancyTitle = vacancy?.title;
              } catch {
                // ignore
              }
            }

            return (
              <Link
                key={conversation.id}
                href={paths.workspace.chat(
                  orgSlug,
                  workspaceSlug,
                  conversation.id,
                )}
              >
                <div
                  className={`flex items-start gap-2 md:gap-3 px-3 md:px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer border-b ${
                    isActive ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <h3 className="font-semibold truncate text-sm md:text-base">
                        Кандидат
                      </h3>
                      {lastMessage && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {format(lastMessage.createdAt, "HH:mm", {
                            locale: ru,
                          })}
                        </span>
                      )}
                    </div>

                    {vacancyTitle && (
                      <Badge
                        variant="outline"
                        className="mb-1 text-xs text-teal-600 border-teal-200"
                      >
                        {vacancyTitle}
                      </Badge>
                    )}

                    {lastMessage && (
                      <p className="text-xs md:text-sm text-muted-foreground truncate">
                        {lastMessage.role === "assistant" && "Вы: "}
                        {lastMessage.content}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
      </div>
    </div>
  );
}
