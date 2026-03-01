"use client";

import { paths } from "@qbs-autonaim/config";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useORPC } from "~/orpc/react";
import { CandidateNavigation } from "./candidate-navigation";
import { VacancyResponseHeaderCard } from "./header-card";
import { useVacancyResponseFlags } from "./hooks/use-vacancy-response-flags";
import { StatusTimeline } from "./status-timeline";
import { VacancyResponseTabs } from "./tabs";
import type { VacancyResponseDetailCardProps } from "./types";

export function VacancyResponseDetailCard({
  response,
  vacancy,
  allResponses,
  onAccept,
  onReject,
  onMessage,
  onEvaluate,
  onNavigate,
  isProcessing,
  isPolling,
}: VacancyResponseDetailCardProps) {
  const orpc = useORPC();
  const router = useRouter();
  const params = useParams<{
    orgSlug?: string;
    slug?: string;
    id?: string;
    responseId?: string;
  }>();
  const {
    hasScreening,
    hasInterviewScoring,
    hasConversation,
    screening,
    conversation,
    getDefaultTab,
  } = useVacancyResponseFlags(response);

  // Получаем presigned URL для PDF резюме
  const resumePdfFileId = response.resumePdfFileId;
  const canFetchPdf = !!(resumePdfFileId && response.workspaceId);
  const { data: resumePdfData } = useQuery({
    ...orpc.files.getFileUrl.queryOptions({
      input: canFetchPdf
        ? { workspaceId: response.workspaceId, fileId: resumePdfFileId }
        : { workspaceId: "", fileId: "" },
    }),
    enabled: canFetchPdf,
  });

  const responsesList = allResponses ?? [];
  const showNavigation = responsesList.length > 1;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Navigation between candidates - только если есть несколько откликов */}
      {showNavigation && (
        <CandidateNavigation
          currentResponse={response}
          allResponses={responsesList}
          onNavigate={
            onNavigate ??
            ((responseId) => {
              const orgSlug = params.orgSlug;
              const workspaceSlug = params.slug;
              const vacancyId = params.id;
              if (!orgSlug || !workspaceSlug) return;
              const href =
                params.responseId != null && vacancyId
                  ? paths.workspace.vacancyResponse(
                      orgSlug,
                      workspaceSlug,
                      vacancyId,
                      responseId,
                    )
                  : paths.workspace.responses(
                      orgSlug,
                      workspaceSlug,
                      responseId,
                    );
              router.push(href);
            })
          }
        />
      )}

      {/* Header Card */}
      <VacancyResponseHeaderCard
        response={response}
        resumePdfUrl={resumePdfData?.url}
        onAccept={onAccept}
        onReject={onReject}
        onMessage={onMessage}
        onEvaluate={onEvaluate}
        isProcessing={isProcessing}
        isPolling={isPolling}
      />

      {/* Main Content Tabs */}
      <VacancyResponseTabs
        response={response}
        vacancy={vacancy}
        defaultTab={getDefaultTab()}
        hasScreening={hasScreening}
        hasInterviewScoring={hasInterviewScoring}
        hasConversation={hasConversation}
        screening={screening}
        conversation={conversation}
      />

      {/* Status Timeline */}
      <StatusTimeline response={response} />
    </div>
  );
}
