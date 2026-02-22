"use client";

import { skipToken, useQuery } from "@tanstack/react-query";
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
  isProcessing,
  isPolling,
}: VacancyResponseDetailCardProps) {
  const orpc = useORPC();
  const {
    hasScreening,
    hasInterviewScoring,
    hasConversation,
    screening,
    conversation,
    getDefaultTab,
  } = useVacancyResponseFlags(response);

  // Получаем presigned URL для PDF резюме
  const { data: resumePdfData } = useQuery(
    orpc.files.getFileUrl.queryOptions(
      response.resumePdfFileId && response.workspaceId
        ? {
            workspaceId: response.workspaceId,
            fileId: response.resumePdfFileId,
          }
        : skipToken,
    ),
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Navigation between candidates */}
      <CandidateNavigation
        currentResponse={response}
        allResponses={allResponses || []}
        onNavigate={(responseId) => {
          // Реализовать навигацию между кандидатами
          const currentUrl = window.location.href;
          const newUrl = currentUrl.replace(
            /\/responses\/[^/]+$/,
            `/responses/${responseId}`,
          );
          window.location.href = newUrl;
        }}
      />

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
