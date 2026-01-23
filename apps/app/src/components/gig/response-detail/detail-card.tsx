"use client";

import {
  ParsedProfileCard,
} from "~/components/response-detail";
import { GigResponseHeaderCard } from "./header-card";
import { useGigResponseFlags } from "./hooks/use-gig-response-flags";
import { GigResponseTabs } from "./tabs";
import type { GigResponseDetailCardProps } from "./types";

export function GigResponseDetailCard({
  response,
  onAccept,
  onReject,
  onMessage,
  onEvaluate,
  isProcessing,
  isPolling,
}: GigResponseDetailCardProps) {
  const { hasInterviewScoring, hasConversation, conversation, getDefaultTab } =
    useGigResponseFlags(response);

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
      <GigResponseHeaderCard
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
      <GigResponseTabs
        response={response}
        defaultTab={getDefaultTab()}
        hasInterviewScoring={hasInterviewScoring}
        hasConversation={hasConversation}
        conversation={conversation}
      />
    </div>
  );
}