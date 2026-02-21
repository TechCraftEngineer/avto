"use client";

import { ParsedProfileCard } from "~/components/shared/components/response-detail-cards";
import { GigResponseHeaderCard } from "./header-card";
import { useGigResponseFlags } from "./hooks/use-gig-response-flags";
import { GigResponseTabs } from "./tabs";
import { ResponseSummaryCard } from "./summary-card";
import type { GigResponseDetailCardProps } from "./types";

export function GigResponseDetailCard({
  response,
  gig,
  onAccept,
  onReject,
  onMessage,
  onSendGreeting,
  onStartKworkChat,
  onEvaluate,
  isProcessing,
  isPolling,
  isSendingGreeting,
  isStartingKworkChat,
}: GigResponseDetailCardProps) {
  const { hasInterviewScoring, hasConversation, conversation, getDefaultTab } =
    useGigResponseFlags(response);

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
      <GigResponseHeaderCard
        response={response}
        gig={gig}
        onAccept={onAccept}
        onReject={onReject}
        onMessage={onMessage}
        onSendGreeting={onSendGreeting}
        onStartKworkChat={onStartKworkChat}
        onEvaluate={onEvaluate}
        isProcessing={isProcessing}
        isPolling={isPolling}
        isSendingGreeting={isSendingGreeting}
        isStartingKworkChat={isStartingKworkChat}
      />

      {/* Summary Card */}
      {gig && <ResponseSummaryCard response={response} gig={gig} />}

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
