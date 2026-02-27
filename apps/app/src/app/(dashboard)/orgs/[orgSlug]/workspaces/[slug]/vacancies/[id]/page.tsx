"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { VacancyRequirements } from "~/components/vacancy/components";
import {
  AIInterviewCard,
  ResponseStatsCard,
  ShortlistCard,
  VacancyDescription,
  VacancyHeader,
  VacancyInsightsCard,
  VacancyNotFound,
  VacancySkeleton,
} from "~/components/vacancy-detail";
import { useWorkspace } from "~/hooks/use-workspace";
import { useORPC } from "~/orpc/react";

export default function VacancyDetailPage() {
  const {
    id,
    orgSlug,
    slug: workspaceSlug,
  } = useParams<{
    id: string;
    orgSlug: string;
    slug: string;
  }>();
  const { workspace } = useWorkspace();
  const api = useORPC();

  const { data, isLoading, error, isError } = useQuery({
    ...api.freelancePlatforms.getVacancyById.queryOptions({
      input: { id, workspaceId: workspace?.id ?? "" },
    }),
    enabled: !!workspace?.id && !!id,
  });

  const { data: shortlistData, isLoading: shortlistLoading } = useQuery({
    ...api.freelancePlatforms.getShortlist.queryOptions({
      input: { vacancyId: id, workspaceId: workspace?.id ?? "" },
    }),
    enabled: !!workspace?.id && !!id,
  });

  const shortlist = shortlistData?.candidates ?? [];

  if (isLoading) {
    return <VacancySkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-2">
          Ошибка загрузки вакансии
        </h2>
        <p className="text-gray-600">
          {error?.message || "Произошла неизвестная ошибка"}
        </p>
      </div>
    );
  }

  if (!workspace?.id || !id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-xl font-semibold text-gray-600 mb-2">
          Загрузка...
        </h2>
        <p className="text-gray-600">Подождите, пока загрузятся параметры</p>
      </div>
    );
  }

  if (!data) {
    return <VacancyNotFound orgSlug={orgSlug} workspaceSlug={workspaceSlug} />;
  }

  const { vacancy, responseStats, interviewLink } = data;

  const totalResponses = Object.values(responseStats).reduce(
    (acc, val) => acc + val,
    0,
  );

  const daysActive = Math.floor(
    (Date.now() - new Date(vacancy.createdAt).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  const hasPublications =
    vacancy.publications && vacancy.publications.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
      {/* ЛЕВАЯ КОЛОНКА - Основная информация */}
      <div className="lg:col-span-2 space-y-6">
        <VacancyHeader vacancy={vacancy} />
        <VacancyDescription description={vacancy.description} />

        {vacancy.requirements && (
          <VacancyRequirements requirements={vacancy.requirements} />
        )}
      </div>

      {/* ПРАВАЯ КОЛОНКА - Действия и статистика */}
      <div className="space-y-6">
        {/* AI-интервью */}
        {interviewLink && (
          <AIInterviewCard
            interviewLink={interviewLink}
            vacancyTitle={vacancy.title}
            vacancyDescription={vacancy.description}
          />
        )}

        {/* Аналитика и рекомендации */}
        <VacancyInsightsCard
          totalResponses={totalResponses}
          daysActive={daysActive}
          isActive={vacancy.isActive ?? false}
          hasPublications={hasPublications}
        />

        {/* Статистика откликов */}
        <ResponseStatsCard
          responseStats={responseStats}
          totalResponses={totalResponses}
          vacancyId={id}
          source={vacancy.source}
          orgSlug={orgSlug}
          workspaceSlug={workspaceSlug}
        />

        {/* Лучшие кандидаты */}
        <ShortlistCard
          shortlist={shortlist}
          shortlistLoading={shortlistLoading}
          orgSlug={orgSlug}
          workspaceSlug={workspaceSlug}
          vacancyId={id}
        />
      </div>
    </div>
  );
}
