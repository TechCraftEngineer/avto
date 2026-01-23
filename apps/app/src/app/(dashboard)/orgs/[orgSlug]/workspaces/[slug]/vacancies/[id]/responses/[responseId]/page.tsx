"use client";

import { paths } from "@qbs-autonaim/config";
import { Button, Skeleton } from "@qbs-autonaim/ui";
import { skipToken, useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { VacancyResponseDetailCard } from "~/components/vacancy/response-detail/detail-card";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useTRPC } from "~/trpc/react";

export default function VacancyResponseDetailPage() {
  const {
    orgSlug,
    slug: workspaceSlug,
    id: vacancyId,
    responseId,
  } = useParams<{
    orgSlug: string;
    slug: string;
    id: string;
    responseId: string;
  }>();
  const trpc = useTRPC();
  const { workspaceId } = useWorkspaceContext();

  const { data: responseData, isLoading } = useQuery(
    trpc.vacancy.responses.get.queryOptions(
      workspaceId
        ? {
            id: responseId,
            workspaceId,
          }
        : skipToken,
    ),
  );

  if (!workspaceId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="text-muted-foreground">Рабочее пространство не найдено</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <Skeleton className="h-10 w-40 mb-4" />
              <div className="space-y-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!responseData) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="text-muted-foreground">Отклик не найден</p>
      </div>
    );
  }

  // Явно указываем тип для response после проверки на null
  const response = responseData;

  // Приводим к VacancyResponse типу
  const vacancyResponse: import("~/components/vacancy/response-detail").VacancyResponse =
    {
      ...response,
      entityType: "vacancy",
      // Гарантируем vacancy-специфичные поля
      resumeId: response.resumeId ?? null,
      resumeUrl: response.resumeUrl ?? null,
      platformProfileUrl: response.platformProfileUrl ?? null,
      salaryExpectationsAmount: response.salaryExpectationsAmount ?? null,
      salaryExpectationsComment: response.salaryExpectationsComment ?? null,
    };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link
                  href={paths.workspace.vacancies(
                    orgSlug,
                    workspaceSlug,
                    vacancyId,
                    "responses",
                  )}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Назад к вакансии
                </Link>
              </Button>
              {response.interviewSession ? (
                <Button variant="default" size="sm" asChild>
                  <Link
                    href={paths.workspace.chat(
                      orgSlug,
                      workspaceSlug,
                      response.candidateId,
                    )}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Открыть чат
                  </Link>
                </Button>
              ) : null}
            </div>

            <VacancyResponseDetailCard response={vacancyResponse} />
          </div>
        </div>
      </div>
    </div>
  );
}
