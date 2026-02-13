"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import {
  Badge,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@qbs-autonaim/ui";
import { Send, TrendingUp, UserCheck } from "lucide-react";
import { ChatIndicator } from "../../ui/chat-indicator";
import { PriorityBadge } from "../../ui/priority-badge";

interface CandidateBadgesProps {
  response: RouterOutputs["vacancy"]["responses"]["list"]["responses"][0];
  orgSlug: string;
  workspaceSlug: string;
}

export function CandidateBadges({
  response,
  orgSlug,
  workspaceSlug,
}: CandidateBadgesProps) {
  return (
    <div className="flex items-center gap-2">
      {response.priorityScore !== undefined && response.priorityScore >= 50 && (
        <PriorityBadge
          priorityScore={response.priorityScore}
          className="text-xs"
        />
      )}

      {response.welcomeSentAt && (
        <HoverCard>
          <HoverCardTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center"
              aria-label="Приветствие отправлено"
            >
              <Send className="h-3 w-3 text-muted-foreground opacity-50" />
            </button>
          </HoverCardTrigger>
          <HoverCardContent side="right">
            <p className="text-xs">Приветствие отправлено</p>
          </HoverCardContent>
        </HoverCard>
      )}

      {response.interviewSession &&
        response.interviewSession.messageCount > 0 && (
          <ChatIndicator
            messageCount={response.interviewSession.messageCount}
            conversationId={response.interviewSession.id}
            orgSlug={orgSlug}
            workspaceSlug={workspaceSlug}
          />
        )}

      {response.screening?.hiddenFitIndicators &&
        response.screening.hiddenFitIndicators.length > 0 && (
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center"
                aria-label="Скрытые индикаторы соответствия"
              >
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 text-xs"
                >
                  <UserCheck className="h-3 w-3" />
                  Скрытый подходящий
                </Badge>
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="right" className="max-w-xs">
              <p className="text-xs font-semibold mb-1">
                Скрытые индикаторы соответствия:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {response.screening.hiddenFitIndicators.map((indicator) => (
                  <li key={indicator} className="text-xs">
                    {indicator}
                  </li>
                ))}
              </ul>
            </HoverCardContent>
          </HoverCard>
        )}

      {response.screening?.careerTrajectoryType && (
        <HoverCard>
          <HoverCardTrigger asChild>
            <Badge
              variant="outline"
              className="flex items-center gap-1 text-xs"
            >
              <TrendingUp className="h-3 w-3" />
              {response.screening.careerTrajectoryType === "growth" && "Рост"}
              {response.screening.careerTrajectoryType === "stable" &&
                "Стабильность"}
              {response.screening.careerTrajectoryType === "decline" &&
                "Деградация"}
              {response.screening.careerTrajectoryType === "jump" && "Скачок"}
              {response.screening.careerTrajectoryType === "role_change" &&
                "Смена роли"}
            </Badge>
          </HoverCardTrigger>
          <HoverCardContent side="right" className="max-w-xs">
            <p
              className="text-xs"
              dangerouslySetInnerHTML={{
                __html: response.screening.careerTrajectoryAnalysis || "",
              }}
            />
          </HoverCardContent>
        </HoverCard>
      )}
    </div>
  );
}
