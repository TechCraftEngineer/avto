"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import { paths } from "@qbs-autonaim/config";
import {
  HR_SELECTION_STATUS_LABELS,
  RESPONSE_STATUS_LABELS,
} from "@qbs-autonaim/db/schema";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Checkbox,
  TableCell,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@qbs-autonaim/ui";
import { Send, User } from "lucide-react";
import Link from "next/link";
import { ResponseActions } from "~/components/response";
import { useAvatarUrl } from "~/hooks/use-avatar-url";
import { getAvatarUrl, getInitials } from "~/lib/avatar";
import { ChatIndicator } from "./chat-indicator";
import { ContactInfo } from "./contact-info";
import { ScreenResponseButton } from "./screen-response-button";
import { ScreeningHoverCard } from "./screening-hover-card";

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
              {response.welcomeSentAt && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Send className="h-3 w-3 text-muted-foreground opacity-50" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="text-xs">Приветствие отправлено</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {response.interviewSession && (
                <ChatIndicator
                  messageCount={response.interviewSession.messageCount}
                  conversationId={response.interviewSession.id}
                  orgSlug={orgSlug}
                  workspaceSlug={workspaceSlug}
                />
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
          {RESPONSE_STATUS_LABELS[response.status]}
        </Badge>
      </TableCell>
      <TableCell>
        {response.screening ? (
          <ScreeningHoverCard screening={response.screening} />
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
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
            {HR_SELECTION_STATUS_LABELS[response.hrSelectionStatus]}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center min-w-[120px]">
          <ContactInfo contacts={response.contacts} size="sm" />
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
