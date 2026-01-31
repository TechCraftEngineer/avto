"use client";

import {
  ParsedProfileCard,
  ResponseHeaderCard,
} from "~/components/response-detail";
import {
  type ResponseDetail,
  useVacancyResponseFlags,
} from "../hooks/use-vacancy-response-flags";
import { VacancyResponseTabs } from "../vacancy-response-tabs";

interface ResponseDetailCardProps {
  response: ResponseDetail;
  onAccept?: () => void;
  onReject?: () => void;
  onMessage?: () => void;
  onEvaluate?: () => void;
  isProcessing?: boolean;
  isPolling?: boolean;
}

export function ResponseDetailCard({
  response,
  onAccept,
  onReject,
  onMessage,
  onEvaluate,
  isProcessing,
  isPolling,
}: ResponseDetailCardProps) {
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
      <ResponseHeaderCard
        response={{
          ...response,
          conversation: mappedConversation,
        }}
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
