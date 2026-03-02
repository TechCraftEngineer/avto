"use client";

import { paths } from "@qbs-autonaim/config";
import { Button } from "@qbs-autonaim/ui/components/button";
import { Skeleton } from "@qbs-autonaim/ui/components/skeleton";
import { cn } from "@qbs-autonaim/ui/utils";
import {
  IconEdit,
  IconEye,
  IconMessage,
  IconPlug,
  IconSettings,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useORPC } from "~/orpc/react";

interface VacancyLayoutClientProps {
  children: React.ReactNode;
  orgSlug: string;
  workspaceSlug: string;
  vacancyId: string;
}

export function VacancyLayoutClient({
  children,
  orgSlug,
  workspaceSlug,
  vacancyId,
}: VacancyLayoutClientProps) {
  const pathname = usePathname();
  const orpc = useORPC();
  const { workspaceId } = useWorkspaceContext();

  const {
    data: vacancy,
    isLoading: vacancyLoading,
    isError: vacancyError,
  } = useQuery(
    orpc.vacancy.get.queryOptions({
      input: {
        id: vacancyId,
        workspaceId: workspaceId ?? "",
      },
      enabled: Boolean(workspaceId),
    }),
  );

  const {
    data: responsesCount,
    isLoading: responsesLoading,
    isError: responsesError,
  } = useQuery(
    orpc.vacancy.responses.count.queryOptions({
      input: {
        vacancyId: vacancyId,
        workspaceId: workspaceId ?? "",
      },
      enabled: Boolean(workspaceId),
    }),
  );

  // Определяем активный таб на основе pathname
  const getActiveTab = () => {
    if (pathname.endsWith("/settings")) return "settings";
    if (pathname.endsWith("/responses")) return "responses";
    if (pathname.endsWith("/edit")) return "edit";
    if (pathname.endsWith("/integrations")) return "integrations";
    return "detail";
  };

  // (1) Если workspaceId еще не доступен, показываем загрузку
  if (!workspaceId) {
    return (
      <div className="flex flex-1 flex-col min-w-0">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 md:px-6">
            <Skeleton className="h-11 w-32 md:h-10 md:w-40 mb-2 md:mb-4" />
            <div className="space-y-4 md:space-y-6">
              <Skeleton className="h-11 w-full md:h-10 md:w-64" />
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // (2) Если есть ошибки в запросах, показываем ошибку
  if (vacancyError || responsesError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 sm:p-6">
        <div className="flex size-12 items-center justify-center rounded-full border border-border bg-muted">
          <svg
            className="size-5 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-sm font-medium text-foreground">
            {vacancyError
              ? "Вакансия не найдена"
              : "Не удалось загрузить отклики"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {vacancyError
              ? "Возможно, она была удалена или у вас нет доступа"
              : "Попробуйте обновить страницу"}
          </p>
        </div>
        {vacancyError && (
          <Button variant="outline" size="sm" asChild>
            <Link href={paths.workspace.vacancies(orgSlug, workspaceSlug)}>
              Вернуться к списку
            </Link>
          </Button>
        )}
      </div>
    );
  }

  // Показываем загрузку пока запросы выполняются
  const isLoading = vacancyLoading || responsesLoading;
  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col min-w-0">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 md:px-6">
            <Skeleton className="h-11 w-32 md:h-10 md:w-40 mb-2 md:mb-4" />
            <div className="space-y-4 md:space-y-6">
              <Skeleton className="h-11 w-full md:h-10 md:w-64" />
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // (3) Только после успешного завершения запросов проверяем, найдена ли вакансия
  if (!vacancy) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <p className="text-center text-muted-foreground">Вакансия не найдена</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-w-0">
      <div className="@container/main flex flex-1 flex-col gap-2 min-w-0">
        <div className="flex flex-col gap-4 -mx-4 px-4 md:mx-0 md:px-6">
          <div className="mb-2 md:mb-4 -ml-2">
            <Button
              variant="ghost"
              size="sm"
              className="min-h-11 min-w-11 touch-manipulation md:min-h-0 md:min-w-0"
              asChild
            >
              <Link href={paths.workspace.vacancies(orgSlug, workspaceSlug)}>
                <ArrowLeft
                  className="mr-2 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                <span className="hidden sm:inline">Назад к списку</span>
                <span className="sm:hidden">Назад</span>
              </Link>
            </Button>
          </div>

          <div className="space-y-4 md:space-y-6">
            <section
              className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Навигация по разделам вакансии"
            >
              <nav className="flex min-w-max flex-wrap items-center gap-1">
                <Button
                  variant="secondary"
                  asChild
                  className={cn(
                    "border border-border bg-white dark:bg-black text-foreground hover:bg-muted transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring h-7 rounded-lg px-2.5 text-sm font-medium",
                    getActiveTab() === "detail" && "bg-muted",
                  )}
                >
                  <Link
                    href={paths.workspace.vacancies(
                      orgSlug,
                      workspaceSlug,
                      vacancyId,
                    )}
                  >
                    <IconEye className="size-4 shrink-0" aria-hidden="true" />
                    Обзор
                  </Link>
                </Button>
                <Button
                  variant="secondary"
                  asChild
                  className={cn(
                    "border border-border bg-white dark:bg-black text-foreground hover:bg-muted transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring h-7 rounded-lg px-2.5 text-sm font-medium",
                    getActiveTab() === "responses" && "bg-muted",
                  )}
                >
                  <Link
                    href={paths.workspace.vacancies(
                      orgSlug,
                      workspaceSlug,
                      vacancyId,
                      "responses",
                    )}
                  >
                    <IconMessage
                      className="size-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="hidden sm:inline">
                      Отклики ({responsesCount?.total ?? 0})
                    </span>
                    <span className="sm:hidden">Отклики</span>
                  </Link>
                </Button>
                <Button
                  variant="secondary"
                  asChild
                  className={cn(
                    "border border-border bg-white dark:bg-black text-foreground hover:bg-muted transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring h-7 rounded-lg px-2.5 text-sm font-medium",
                    getActiveTab() === "edit" && "bg-muted",
                  )}
                >
                  <Link
                    href={paths.workspace.vacancies(
                      orgSlug,
                      workspaceSlug,
                      vacancyId,
                      "edit",
                    )}
                  >
                    <IconEdit className="size-4 shrink-0" aria-hidden="true" />
                    <span className="hidden sm:inline">Редактировать</span>
                    <span className="sm:hidden">Редакт.</span>
                  </Link>
                </Button>
                <Button
                  variant="secondary"
                  asChild
                  className={cn(
                    "border border-border bg-white dark:bg-black text-foreground hover:bg-muted transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring h-7 rounded-lg px-2.5 text-sm font-medium",
                    getActiveTab() === "integrations" && "bg-muted",
                  )}
                >
                  <Link
                    href={paths.workspace.vacancies(
                      orgSlug,
                      workspaceSlug,
                      vacancyId,
                      "integrations",
                    )}
                  >
                    <IconPlug className="size-4 shrink-0" aria-hidden="true" />
                    <span className="hidden sm:inline">Интеграции</span>
                    <span className="sm:hidden">Интегр.</span>
                  </Link>
                </Button>
                <Button
                  variant="secondary"
                  asChild
                  className={cn(
                    "border border-border bg-white dark:bg-black text-foreground hover:bg-muted transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring h-7 rounded-lg px-2.5 text-sm font-medium",
                    getActiveTab() === "settings" && "bg-muted",
                  )}
                >
                  <Link
                    href={paths.workspace.vacancies(
                      orgSlug,
                      workspaceSlug,
                      vacancyId,
                      "settings",
                    )}
                  >
                    <IconSettings
                      className="size-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="hidden sm:inline">Настройки</span>
                    <span className="sm:hidden">Настр.</span>
                  </Link>
                </Button>
              </nav>
            </section>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
