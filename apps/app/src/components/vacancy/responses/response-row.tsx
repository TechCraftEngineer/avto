"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import { paths } from "@qbs-autonaim/config";
import type {
  VacancyHrSelectionStatus,
  VacancyResponseStatus,
} from "@qbs-autonaim/db/schema";
import {
  HR_SELECTION_STATUS_LABELS,
  RESPONSE_STATUS_LABELS,
} from "@qbs-autonaim/db/schema";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Checkbox,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  TableCell,
  TableRow,
} from "@qbs-autonaim/ui";
import DOMPurify from "dompurify";
import { ExternalLink, Send, TrendingUp, User, UserCheck } from "lucide-react";
import Link from "next/link";
import { ResponseActions } from "~/components/response";
import { useAvatarUrl } from "~/hooks/use-avatar-url";
import { getAvatarUrl, getInitials } from "~/lib/avatar";
import { ContactInfo } from "../integrations/contact-info";
import { ScreenResponseButton } from "../screening/screen-response-button";
import { ScreeningHoverCard } from "../screening/screening-hover-card";
import { ChatIndicator } from "../ui/chat-indicator";
import { PriorityBadge } from "../ui/priority-badge";

// Утилита для удаления HTML-тегов из текста
function stripHtmlTags(html: string): string {
  if (typeof window === "undefined") {
    // Server-side: simple regex approach
    return html.replace(/<[^>]*>/g, "");
  }
  // Client-side: use DOM parser for better accuracy
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

// Утилита для санитизации HTML
function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
      "code",
      "pre",
    ],
    ALLOWED_ATTR: [],
  });
}

interface ResponseRowProps {
  response: RouterOutputs["vacancy"]["responses"]["list"]["responses"][0];
  orgSlug: string;
  workspaceSlug: string;
  accessToken: string | undefined;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  vacancyId?: string;
}

export function ResponseRow({
  response,
  orgSlug,
  workspaceSlug,
  accessToken,
  isSelected = false,
  onSelect,
  vacancyId,
}: ResponseRowProps) {
  const photoUrl = useAvatarUrl(response.photoFileId);
  const candidateName = response.candidateName || "Кандидат";
  const avatarUrl = getAvatarUrl(photoUrl, candidateName);
  const initials = getInitials(candidateName);

  return (
    <TableRow className="group">
      <TableCell className="pl-4">
        {onSelect ? (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect(response.id)}
          />
        ) : (
          <div className="w-4" />
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border shrink-0">
            <AvatarImage src={avatarUrl} alt={candidateName} />
            <AvatarFallback className="text-xs font-medium bg-muted text-muted-foreground">
              {initials || <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={
                  vacancyId
                    ? paths.workspace.vacancyResponse(
                        orgSlug,
                        workspaceSlug,
                        vacancyId,
                        response.id,
                      )
                    : paths.workspace.responses(
                        orgSlug,
                        workspaceSlug,
                        response.id,
                      )
                }
                className="font-medium text-sm hover:underline truncate transition-colors"
                prefetch={false}
              >
                {response.candidateName || "Без имени"}
              </Link>
              {response.priorityScore !== undefined &&
                response.priorityScore >= 50 && (
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
              {response.interviewSession && (
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
                        {response.screening.hiddenFitIndicators.map(
                          (indicator) => (
                            <li key={indicator} className="text-xs">
                              {indicator}
                            </li>
                          ),
                        )}
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
                      {response.screening.careerTrajectoryType === "growth" &&
                        "Рост"}
                      {response.screening.careerTrajectoryType === "stable" &&
                        "Стабильность"}
                      {response.screening.careerTrajectoryType === "decline" &&
                        "Деградация"}
                      {response.screening.careerTrajectoryType === "jump" &&
                        "Скачок"}
                      {response.screening.careerTrajectoryType ===
                        "role_change" && "Смена роли"}
                    </Badge>
                  </HoverCardTrigger>
                  <HoverCardContent side="right" className="max-w-xs">
                    <div
                      className="text-xs"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(
                          response.screening.careerTrajectoryAnalysis || "",
                        ),
                      }}
                    />
                  </HoverCardContent>
                </HoverCard>
              )}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant={
            response.status === "NEW"
              ? "secondary"
              : response.status === "SKIPPED"
                ? "destructive"
                : "outline"
          }
          className="whitespace-nowrap rounded-md font-normal"
        >
          {(response.status as VacancyResponseStatus) in RESPONSE_STATUS_LABELS
            ? RESPONSE_STATUS_LABELS[response.status as VacancyResponseStatus]
            : response.status}
        </Badge>
      </TableCell>
      <TableCell>
        {response.priorityScore != null ? (
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">
              {response.priorityScore}
            </span>
            <span className="text-xs text-muted-foreground">/10</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </TableCell>
      <TableCell>
        {response.screening ? (
          <ScreeningHoverCard screening={response.screening} />
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </TableCell>
      <TableCell>
        {response.screening?.potentialScore != null ? (
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">
              {response.screening.potentialScore}
            </span>
            <span className="text-xs text-muted-foreground">/10</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </TableCell>
      <TableCell>
        {response.screening?.careerTrajectoryScore ? (
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">
              {response.screening.careerTrajectoryScore}
            </span>
            <span className="text-xs text-muted-foreground">/10</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </TableCell>
      <TableCell>
        {/* Риски будут вычисляться на основе данных скрининга */}
        {/* Пока оставляем пустым, можно добавить позже через отдельный API */}
        <span className="text-muted-foreground text-xs">—</span>
      </TableCell>
      <TableCell>
        {response.interviewScoring ? (
          <ScreeningHoverCard screening={response.interviewScoring} />
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </TableCell>
      <TableCell>
        {response.hrSelectionStatus ? (
          <Badge variant="outline" className="whitespace-nowrap font-normal">
            {(response.hrSelectionStatus as VacancyHrSelectionStatus) in
            HR_SELECTION_STATUS_LABELS
              ? HR_SELECTION_STATUS_LABELS[
                  response.hrSelectionStatus as VacancyHrSelectionStatus
                ]
              : response.hrSelectionStatus}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center min-w-32">
          <ContactInfo contacts={response.contacts} size="sm" />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {response.resumeUrl ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs gap-1 hover:bg-primary/10"
              onClick={() =>
                response.resumeUrl &&
                window.open(response.resumeUrl, "_blank", "noopener,noreferrer")
              }
            >
              <ExternalLink className="h-3 w-3" />
              Открыть
            </Button>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="max-w-50 truncate">
          {response.coverLetter ? (
            <HoverCard>
              <HoverCardTrigger asChild>
                <span className="text-sm text-muted-foreground cursor-help">
                  {(() => {
                    const plainText = stripHtmlTags(response.coverLetter);
                    return plainText.length > 50
                      ? `${plainText.substring(0, 50)}...`
                      : plainText;
                  })()}
                </span>
              </HoverCardTrigger>
              <HoverCardContent
                side="left"
                className="max-w-sm max-h-64 overflow-y-auto"
              >
                <div
                  className="text-sm"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(response.coverLetter),
                  }}
                />
              </HoverCardContent>
            </HoverCard>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <span className="text-sm font-medium text-foreground">
          {response.respondedAt
            ? new Date(response.respondedAt)
                .toLocaleDateString("ru-RU", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
                .replace(" г.", "")
            : "—"}
        </span>
      </TableCell>
      <TableCell className="pr-4 text-right">
        <div className="flex items-center justify-end gap-2 px-1">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
            {response.status === "NEW" && accessToken && (
              <ScreenResponseButton
                responseId={response.id}
                accessToken={accessToken}
                candidateName={response.candidateName || undefined}
              />
            )}
            <ResponseActions
              responseId={response.id}
              resumeUrl={response.resumeUrl}
              candidateName={response.candidateName}
              telegramUsername={response.telegramUsername}
              phone={response.phone}
            />
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
