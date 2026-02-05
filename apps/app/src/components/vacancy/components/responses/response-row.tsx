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
import { calculateAge } from "@qbs-autonaim/lib";
import { getInitials } from "@qbs-autonaim/shared";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Checkbox,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  TableCell,
  TableRow,
} from "@qbs-autonaim/ui";
import {
  Cake,
  Mail,
  MapPin,
  Phone,
  Send,
  TrendingUp,
  User,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { ResponseActions } from "~/components";
import { useAvatarUrl } from "~/hooks/use-avatar-url";
import { getAvatarUrl } from "~/lib/avatar";
import { ScreeningHoverCard } from "../screening/screening-hover-card";
import { ChatIndicator } from "../ui/chat-indicator";
import { PriorityBadge } from "../ui/priority-badge";

interface ResponseRowProps {
  response: RouterOutputs["vacancy"]["responses"]["list"]["responses"][0];
  orgSlug: string;
  workspaceSlug: string;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  vacancyId?: string;
}

export function ResponseRow({
  response,
  orgSlug,
  workspaceSlug,
  isSelected = false,
  onSelect,
  vacancyId,
}: ResponseRowProps) {
  const photoUrl = useAvatarUrl(response.photoFileId);
  const candidateName = response.candidateName || "Кандидат";
  const avatarUrl = getAvatarUrl(photoUrl, candidateName);
  const initials = getInitials(candidateName);

  // Вычисляем возраст
  const age = response.birthDate ? calculateAge(response.birthDate) : null;

  // Получаем локацию
  const location = response.globalCandidate?.location || null;

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
                    <p className="text-xs">
                      {response.screening.careerTrajectoryAnalysis || ""}
                    </p>
                  </HoverCardContent>
                </HoverCard>
              )}
            </div>
            {/* Дополнительная информация о кандидате */}
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              {age !== null && (
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <Cake className="h-3 w-3 shrink-0" />
                      <span>
                        {age} {age === 1 ? "год" : age < 5 ? "года" : "лет"}
                      </span>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent side="right" className="w-auto">
                    <p className="text-xs">
                      Дата рождения:{" "}
                      {response.birthDate
                        ? new Date(response.birthDate).toLocaleDateString(
                            "ru-RU",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            },
                          )
                        : "—"}
                    </p>
                  </HoverCardContent>
                </HoverCard>
              )}
              {location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate max-w-[120px]">{location}</span>
                </div>
              )}
              {response.phone && (
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <Phone className="h-3 w-3 shrink-0" />
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent side="right" className="w-auto">
                    <p className="text-xs">{response.phone}</p>
                  </HoverCardContent>
                </HoverCard>
              )}
              {response.email && (
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <Mail className="h-3 w-3 shrink-0" />
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent side="right" className="w-auto">
                    <p className="text-xs break-all">{response.email}</p>
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
          {Object.hasOwn(RESPONSE_STATUS_LABELS, response.status)
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
        {response.salaryExpectationsAmount ? (
          <span className="text-sm font-medium">
            {new Intl.NumberFormat("ru-RU").format(
              response.salaryExpectationsAmount,
            )}{" "}
            ₽
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </TableCell>
      <TableCell>
        {/* Навыки - можно добавить позже */}
        <span className="text-muted-foreground text-xs">—</span>
      </TableCell>
      <TableCell>
        {response.compositeScore != null ? (
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">
              {response.compositeScore}
            </span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
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
            {Object.hasOwn(
              HR_SELECTION_STATUS_LABELS,
              response.hrSelectionStatus,
            )
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
        <div className="max-w-50 truncate">
          {response.coverLetter ? (
            <HoverCard>
              <HoverCardTrigger asChild>
                <span className="text-sm text-muted-foreground cursor-help">
                  {response.coverLetter.length > 50
                    ? `${response.coverLetter.substring(0, 50)}...`
                    : response.coverLetter}
                </span>
              </HoverCardTrigger>
              <HoverCardContent
                side="left"
                className="max-w-sm max-h-64 overflow-y-auto"
              >
                <p className="text-sm whitespace-pre-wrap">
                  {response.coverLetter}
                </p>
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
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <ResponseActions
              responseId={response.id}
              resumeUrl={response.resumeUrl}
              telegramUsername={response.telegramUsername}
              phone={response.phone}
              welcomeSentAt={response.welcomeSentAt}
              onSendWelcome={async () => {
                // TODO: Реализовать отправку приветствия
                console.log("Отправка приветствия для отклика:", response.id);
              }}
            />
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
