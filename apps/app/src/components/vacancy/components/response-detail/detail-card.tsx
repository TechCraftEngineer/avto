"use client";

import { skipToken, useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { CandidateNavigation } from "./candidate-navigation";
import { VacancyResponseHeaderCard } from "./header-card";
import { useVacancyResponseFlags } from "./hooks/use-vacancy-response-flags";
import { QuickActionsFab } from "./quick-actions-fab";
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
  const trpc = useTRPC();
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
    trpc.files.getFileUrl.queryOptions(
      response.resumePdfFileId && response.workspaceId
        ? {
            workspaceId: response.workspaceId,
            fileId: response.resumePdfFileId,
          }
        : skipToken,
    ),
  );

  // Преобразуем conversation для ResponseHeaderCard
  const _mappedConversation = conversation
    ? {
        id: conversation.id,
        status: conversation.status,
        messages: conversation.messages.map((msg) => ({
          id: msg.id,
          sender: msg.role,
          content: msg.content ?? "",
          contentType: msg.type,
          voiceTranscription: msg.voiceTranscription,
          createdAt: msg.createdAt,
        })),
      }
    : null;

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

      {/* Status Timeline */}
      <StatusTimeline response={response} />

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

      {/* Быстрые действия FAB */}
      <QuickActionsFab response={response} />
    </div>
  );
}
