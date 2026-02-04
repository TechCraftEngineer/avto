"use client";

import { skipToken, useQuery } from "@tanstack/react-query";
import { ParsedProfileCard } from "~/components";
import { useTRPC } from "~/trpc/react";
import { VacancyResponseHeaderCard } from "./header-card";
import { useVacancyResponseFlags } from "./hooks/use-vacancy-response-flags";
import { VacancyResponseTabs } from "./tabs";
import type { VacancyResponseDetailCardProps } from "./types";

export function VacancyResponseDetailCard({
  response,
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

      {/* Parsed Profile Info */}
      {response.profileData && !response.profileData.error && (
        <ParsedProfileCard profileData={response.profileData} />
      )}

      {/* Main Content Tabs */}
      <VacancyResponseTabs
        response={response}
        defaultTab={getDefaultTab()}
        hasScreening={hasScreening}
        hasInterviewScoring={hasInterviewScoring}
        hasConversation={hasConversation}
        screening={screening}
        conversation={conversation}
      />
    </div>
  );
}
