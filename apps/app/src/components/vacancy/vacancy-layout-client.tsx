"use client";

import { paths } from "@qbs-autonaim/config";
import {
  Button,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@qbs-autonaim/ui";
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
import { useTRPC } from "~/trpc/react";

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
  const trpc = useTRPC();
  const { workspaceId } = useWorkspaceContext();

  const {
    data: vacancy,
    isLoading: vacancyLoading,
    isError: vacancyError,
  } = useQuery({
    ...trpc.vacancy.get.queryOptions({
      id: vacancyId,
      workspaceId: workspaceId ?? "",
    }),
    enabled: Boolean(workspaceId),
  });

  const {
    data: responsesCount,
    isLoading: responsesLoading,
    isError: responsesError,
  } = useQuery({
    ...trpc.vacancy.responses.count.queryOptions({
      vacancyId: vacancyId,
      workspaceId: workspaceId ?? "",
    }),
    enabled: Boolean(workspaceId),
  });

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
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <Skeleton className="h-10 md:h-10 w-32 md:w-40 mb-4" />
              <div className="space-y-4 md:space-y-6">
                <Skeleton className="h-10 md:h-10 w-full md:w-64" />
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // (2) Если есть ошибки в запросах, показываем ошибку
  if (vacancyError || responsesError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="text-destructive">
          {vacancyError
            ? "Ошибка при загрузке вакансии"
            : "Ошибка при загрузке откликов"}
        </p>
      </div>
    );
  }

  // Показываем загрузку пока запросы выполняются
  const isLoading = vacancyLoading || responsesLoading;
  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <Skeleton className="h-10 md:h-10 w-32 md:w-40 mb-4" />
              <div className="space-y-4 md:space-y-6">
                <Skeleton className="h-10 md:h-10 w-full md:w-64" />
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // (3) Только после успешного завершения запросов проверяем, найдена ли вакансия
  if (!vacancy) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="text-muted-foreground">Вакансия не найдена</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4">
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              className="min-h-11 md:min-h-0"
              asChild
            >
              <Link href={paths.workspace.vacancies(orgSlug, workspaceSlug)}>
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Назад к списку</span>
                <span className="sm:hidden">Назад</span>
              </Link>
            </Button>
          </div>

          <Tabs value={getActiveTab()} className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger
                  value="detail"
                  asChild
                  className="flex-1 sm:flex-initial min-h-11 md:min-h-0 gap-2"
                >
                  <Link
                    href={paths.workspace.vacancies(
                      orgSlug,
                      workspaceSlug,
                      vacancyId,
                    )}
                  >
                    <IconEye className="size-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Обзор</span>
                    <span className="sm:hidden">Обзор</span>
                  </Link>
                </TabsTrigger>
                <TabsTrigger
                  value="responses"
                  asChild
                  className="flex-1 sm:flex-initial min-h-11 md:min-h-0 gap-2"
                >
                  <Link
                    href={paths.workspace.vacancies(
                      orgSlug,
                      workspaceSlug,
                      vacancyId,
                      "responses",
                    )}
                  >
                    <IconMessage className="size-4" aria-hidden="true" />
                    <span className="hidden sm:inline">
                      Отклики ({responsesCount?.total ?? 0})
                    </span>
                    <span className="sm:hidden">Отклики</span>
                  </Link>
                </TabsTrigger>
                <TabsTrigger
                  value="edit"
                  asChild
                  className="flex-1 sm:flex-initial min-h-11 md:min-h-0 gap-2"
                >
                  <Link
                    href={paths.workspace.vacancies(
                      orgSlug,
                      workspaceSlug,
                      vacancyId,
                      "edit",
                    )}
                  >
                    <IconEdit className="size-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Редактировать</span>
                    <span className="sm:hidden">Редакт.</span>
                  </Link>
                </TabsTrigger>
                <TabsTrigger
                  value="integrations"
                  asChild
                  className="flex-1 sm:flex-initial min-h-11 md:min-h-0 gap-2"
                >
                  <Link
                    href={paths.workspace.vacancies(
                      orgSlug,
                      workspaceSlug,
                      vacancyId,
                      "integrations",
                    )}
                  >
                    <IconPlug className="size-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Интеграции</span>
                    <span className="sm:hidden">Интегр.</span>
                  </Link>
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  asChild
                  className="flex-1 sm:flex-initial min-h-11 md:min-h-0 gap-2"
                >
                  <Link
                    href={paths.workspace.vacancies(
                      orgSlug,
                      workspaceSlug,
                      vacancyId,
                      "settings",
                    )}
                  >
                    <IconSettings className="size-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Настройки</span>
                    <span className="sm:hidden">Настр.</span>
                  </Link>
                </TabsTrigger>
              </TabsList>
            </div>

            {children}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
