"use client";

import { Card, CardContent, CardHeader } from "@qbs-autonaim/ui";
import { CandidateActions } from "./candidate-actions";
import { CandidateInfo } from "./candidate-info";
import { CandidateKeyInfo } from "./candidate-key-info";
import {
  calculateLastActivity,
  calculateMatchScore,
  calculateResponseTime,
} from "./header-card-utils";
import { HrNotes } from "./hr-notes";
import type { VacancyResponse } from "./types";

interface VacancyResponseHeaderCardProps {
  response: VacancyResponse;
  resumePdfUrl?: string | null;
  onAccept?: () => void;
  onReject?: () => void;
  onMessage?: () => void;
  onEvaluate?: () => void;
  isProcessing?: boolean;
  isPolling?: boolean;
}

export function VacancyResponseHeaderCard({
  response,
  resumePdfUrl,
  onAccept,
  onReject,
  onMessage,
  onEvaluate,
  isProcessing,
  isPolling,
}: VacancyResponseHeaderCardProps) {
  const matchScore = calculateMatchScore(response);
  const responseTime = calculateResponseTime(response);
  const lastActivity = calculateLastActivity(response);
  const candidateRank = Math.floor(Math.random() * 10) + 1;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <CandidateInfo
            response={response}
            matchScore={matchScore}
            candidateRank={candidateRank}
            responseTime={responseTime}
            lastActivity={lastActivity}
          />

          <CandidateActions
            response={response}
            onAccept={onAccept}
            onReject={onReject}
            onMessage={onMessage}
            onEvaluate={onEvaluate}
            isProcessing={isProcessing}
            isPolling={isPolling}
          />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <CandidateKeyInfo response={response} resumePdfUrl={resumePdfUrl} />
        <HrNotes responseId={response.id} />
      </CardContent>
    </Card>
  );
}
