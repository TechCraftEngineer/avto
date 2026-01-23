"use client";

import {
  ParsedProfileCard,
} from "~/components/response-detail";
import { HeaderCard } from "./header-card";
import { useVacancyResponseFlags } from "./hooks/use-vacancy-response-flags";
import { Tabs } from "./tabs";
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
  const {
    hasScreening,
    hasInterviewScoring,
    hasConversation,
    screening,
    conversation,
    getDefaultTab,
  } = useVacancyResponseFlags(response);

  // Преобразуем conversation для ResponseHeaderCard
  const mappedConversation = conversation
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
      <HeaderCard
        response={response}
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
      <Tabs
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