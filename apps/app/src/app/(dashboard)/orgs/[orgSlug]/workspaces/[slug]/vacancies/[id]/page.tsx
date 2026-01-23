"use client";

import { Button } from "@qbs-autonaim/ui";
import { IconUpload } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { VacancyRequirements } from "~/components/vacancy";
import {
  AIInterviewCard,
  ResponseStatsCard,
  ShortlistCard,
  VacancyDescription,
  VacancyHeader,
  VacancyNotFound,
  VacancySkeleton,
} from "~/components/vacancy-detail";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

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
  const api = useTRPC();

  const { data, isLoading, error, isError } = useQuery({
    ...api.freelancePlatforms.getVacancyById.queryOptions({
      id,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id && !!id,
  });

  const { data: shortlistData, isLoading: shortlistLoading } = useQuery({
    ...api.freelancePlatforms.getShortlist.queryOptions({
      vacancyId: id,
      workspaceId: workspace?.id ?? "",
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

  // Если мы здесь, значит data существует (проверка выше гарантирует это)
  const { vacancy, responseStats, interviewLink } = data;
  const isFreelancePlatform = [
    "KWORK",
    "FL_RU",
    "FREELANCE_RU",
    "AVITO",
    "SUPERJOB",
  ].includes(vacancy.source.toUpperCase());

  const totalResponses = Object.values(responseStats).reduce(
    (acc, val) => acc + val,
    0,
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
      {/* ЛЕВАЯ КОЛОНКА */}
      <div className="lg:col-span-2 space-y-6">
        <VacancyHeader vacancy={vacancy} />
        <VacancyDescription description={vacancy.description} />

        {vacancy.requirements && (
          <VacancyRequirements requirements={vacancy.requirements} />
        )}
      </div>

      {/* ПРАВАЯ КОЛОНКА */}
      <div className="space-y-6">
        {isFreelancePlatform && (
          <Button asChild className="w-full h-10 gap-2">
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${id}/import`}
            >
              <IconUpload className="size-4" />
              Импорт откликов
            </Link>
          </Button>
        )}

        {interviewLink && (
          <AIInterviewCard
            interviewLink={interviewLink}
            vacancyTitle={vacancy.title}
            vacancyDescription={vacancy.description}
          />
        )}

        <ResponseStatsCard
          responseStats={responseStats}
          totalResponses={totalResponses}
        />

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
