"use client";

import { paths } from "@qbs-autonaim/config";
import { Badge } from "@qbs-autonaim/ui/components/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@qbs-autonaim/ui/components/empty";
import { Input } from "@qbs-autonaim/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@qbs-autonaim/ui/components/select";
import { Separator } from "@qbs-autonaim/ui/components/separator";
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
import { useORPC } from "~/orpc/react";

export function ChatList() {
  const { orgSlug, slug: workspaceSlug } = useWorkspaceParams();
  const orpc = useORPC();
  const { workspace } = useWorkspace();
  const pathname = usePathname();
  const [selectedVacancyId, setSelectedVacancyId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: vacancies = [] } = useQuery({
    ...orpc.vacancy.list.queryOptions({
      input: { workspaceId: workspace?.id ?? "" },
    }),
    enabled: !!workspace?.id,
  });

  const {
    data: conversations = [],
    isPending,
    error,
  } = useQuery({
    ...orpc.telegram.conversation.getAll.queryOptions({
      input: {
        workspaceId: workspace?.id ?? "",
        vacancyId: selectedVacancyId === "all" ? undefined : selectedVacancyId,
      },
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
    if (process.env.NODE_ENV === "development") {
      console.error("[ChatList] Failed to load conversations:", error);
    }
    return (
      <div className="flex min-h-[400px] items-center justify-center p-4">
        <Empty className="border-destructive/50 max-w-sm">
          <EmptyHeader>
            <EmptyMedia
              variant="icon"
              className="bg-destructive/10 text-destructive"
            >
              <MessageCircle className="size-6" />
            </EmptyMedia>
            <EmptyTitle>Ошибка</EmptyTitle>
            <EmptyDescription>
              Что-то пошло не так при загрузке чатов
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  if (!isPending && conversations.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-4">
        <Empty className="border-border max-w-sm">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageCircle className="size-6" />
            </EmptyMedia>
            <EmptyTitle>Нет чатов</EmptyTitle>
            <EmptyDescription>
              Пока нет активных диалогов с кандидатами
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 md:px-4 py-3 space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Чаты</h2>

        <div className="space-y-2">
          <label
            htmlFor="search-input"
            className="text-sm font-medium leading-none text-muted-foreground"
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
      <Separator />
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
                className={`flex items-start gap-2 md:gap-3 px-3 md:px-4 py-3 transition-colors cursor-pointer border-b border-border last:border-b-0 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  isActive ? "bg-accent" : ""
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
                    <Badge variant="secondary" className="mb-1 text-xs">
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
              </Link>
            );
          })}
      </div>
    </div>
  );
}
