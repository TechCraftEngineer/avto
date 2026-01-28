"use client";

import { sanitizeHtmlFunction } from "@qbs-autonaim/shared/client";
import { Badge, Button, Skeleton } from "@qbs-autonaim/ui";
import { IconArrowLeft, IconEdit, IconExternalLink } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { use } from "react";
import { PageHeader } from "~/components/layout";
import {
  UpdateVacancyButton,
  VacancyAnalytics,
  VacancyRequirements,
  VacancyStats,
} from "~/components/vacancy";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useTRPC } from "~/trpc/react";

interface VacancyDetailPageProps {
  params: Promise<{ orgSlug: string; slug: string; id: string }>;
}

export default function VacancyDetailPage({ params }: VacancyDetailPageProps) {
  const { orgSlug, slug: workspaceSlug, id } = use(params);
  const trpc = useTRPC();
  const { workspaceId } = useWorkspaceContext();

  const { data: vacancy, isLoading } = useQuery({
    ...trpc.vacancy.get.queryOptions({
      id,
      workspaceId: workspaceId ?? "",
    }),
    enabled: Boolean(workspaceId),
  });

  const { data: analytics } = useQuery({
    ...trpc.vacancy.analytics.queryOptions({
      vacancyId: id,
      workspaceId: workspaceId ?? "",
    }),
    enabled: Boolean(id) && Boolean(workspaceId),
  });

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-3 py-4 px-4 md:px-6 lg:px-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-[300px]" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-[120px]" />
            <Skeleton className="h-9 w-[100px]" />
          </div>
        </div>
        <div className="flex flex-1 flex-col px-4 py-6 lg:px-6">
          <div className="space-y-6">
            <Skeleton className="h-[200px] w-full rounded-lg" />
            <Skeleton className="h-[400px] w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader
          title="Вакансия не найдена"
          description="Запрошенная вакансия не существует или была удалена"
          tooltipContent="[Подробнее в документации](https://docs.hh.qbs.ru/vacancies)"
        >
          <Button variant="outline" asChild>
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies`}
              aria-label="Вернуться к списку вакансий"
            >
              <IconArrowLeft className="size-4" aria-hidden="true" />К списку
              вакансий
            </Link>
          </Button>
        </PageHeader>
      </div>
    );
  }

  const sourceLabel =
    vacancy.source === "HH"
      ? "HeadHunter"
      : vacancy.source === "KWORK"
        ? "Kwork"
        : vacancy.source === "FL_RU"
          ? "FL.ru"
          : vacancy.source === "FREELANCE_RU"
            ? "Freelance.ru"
            : vacancy.source === "AVITO"
              ? "Avito"
              : vacancy.source === "SUPERJOB"
                ? "SuperJob"
                : vacancy.source === "HABR"
                  ? "Хабр Карьера"
                  : vacancy.source;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title={vacancy.title}
        description={`Вакансия на платформе ${sourceLabel}`}
        tooltipContent="[Подробнее в документации](https://docs.hh.qbs.ru/vacancies)"
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies`}
              aria-label="Вернуться к списку вакансий"
            >
              <IconArrowLeft className="size-4" aria-hidden="true" />К списку
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${id}/edit`}
              aria-label="Редактировать вакансию"
            >
              <IconEdit className="size-4" aria-hidden="true" />
              Редактировать
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="flex flex-1 flex-col px-4 py-6 lg:px-6">
        <div className="space-y-6">
          {analytics && (
            <VacancyAnalytics
              totalResponses={analytics.totalResponses}
              processedResponses={analytics.processedResponses}
              highScoreResponses={analytics.highScoreResponses}
              topScoreResponses={analytics.topScoreResponses}
              avgScore={analytics.avgScore}
            />
          )}

          <div className="rounded-lg border bg-linear-to-t from-primary/5 to-card dark:bg-card p-6 shadow-xs space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{sourceLabel}</Badge>
                  {vacancy.isActive ? (
                    <Badge variant="default">Активна</Badge>
                  ) : (
                    <Badge variant="secondary">Неактивна</Badge>
                  )}
                  {vacancy.region && (
                    <Badge variant="outline">{vacancy.region}</Badge>
                  )}
                </div>
                {vacancy.url && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={vacancy.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Открыть вакансию на платформе"
                    >
                      <IconExternalLink className="size-4" aria-hidden="true" />
                      Открыть на платформе
                    </a>
                  </Button>
                )}
              </div>
              <UpdateVacancyButton vacancyId={vacancy.id} />
            </div>

            <VacancyStats
              views={vacancy.views}
              responses={vacancy.responses}
              newResponses={vacancy.newResponses}
              resumesInProgress={vacancy.resumesInProgress}
            />

            {vacancy.description ? (
              <div className="space-y-3 pt-4 border-t">
                <h2 className="text-lg font-semibold">Описание вакансии</h2>
                <div
                  className="prose prose-sm max-w-none dark:prose-invert text-sm leading-relaxed text-muted-foreground [&_p]:mb-3 [&_p]:leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtmlFunction(vacancy.description || ""),
                  }}
                />
              </div>
            ) : (
              <div className="pt-4 border-t">
                <div className="text-center py-8 space-y-3">
                  <div className="flex justify-center">
                    <div className="bg-muted/50 rounded-full p-4">
                      <IconEdit className="size-6 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-foreground">
                      Описание не добавлено
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Добавьте описание вакансии, чтобы кандидаты могли лучше
                      понять требования и условия работы
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {vacancy.requirements && (
            <VacancyRequirements
              requirements={vacancy.requirements as unknown}
            />
          )}
        </div>
      </div>
    </div>
  );
}
