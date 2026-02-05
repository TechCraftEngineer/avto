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
import { formatPhone } from "@qbs-autonaim/validators";
import {
  Cake,
  Check,
  Copy,
  Mail,
  MapPin,
  Phone,
  Send,
  TrendingUp,
  User,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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
  workspaceId: string;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  vacancyId?: string;
  onAnalyzeClick?: (responseId: string, candidateName: string) => void;
}

export function ResponseRow({
  response,
  orgSlug,
  workspaceSlug,
  workspaceId,
  isSelected = false,
  onSelect,
  vacancyId,
  onAnalyzeClick,
}: ResponseRowProps) {
  const photoUrl = useAvatarUrl(response.photoFileId);
  const candidateName = response.candidateName || "Кандидат";
  const avatarUrl = getAvatarUrl(photoUrl, candidateName);
  const initials = getInitials(candidateName);

  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Вычисляем возраст
  const age = response.birthDate ? calculateAge(response.birthDate) : null;

  // Получаем локацию
  const location = response.globalCandidate?.location || null;

  const handleCopyPhone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (response.phone) {
      await navigator.clipboard.writeText(response.phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const handleCopyEmail = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (response.email) {
      await navigator.clipboard.writeText(response.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  // Форматируем телефон для отображения
  const formattedPhone = response.phone
    ? (() => {
        try {
          return formatPhone(response.phone);
        } catch {
          return response.phone;
        }
      })()
    : null;

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
          <HoverCard openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>
              <button
                type="button"
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-transform hover:scale-105"
                aria-label={`Фото ${candidateName}`}
              >
                <Avatar className="h-9 w-9 border shrink-0">
                  <AvatarImage src={avatarUrl} alt={candidateName} />
                  <AvatarFallback className="text-xs font-medium bg-muted text-muted-foreground">
                    {initials || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="right" className="w-auto p-2">
              <Avatar className="h-32 w-32 border-2">
                <AvatarImage src={avatarUrl} alt={candidateName} />
                <AvatarFallback className="text-4xl font-medium bg-muted text-muted-foreground">
                  {initials || <User className="h-12 w-12" />}
                </AvatarFallback>
              </Avatar>
            </HoverCardContent>
          </HoverCard>
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
                  <HoverCardContent side="right" className="w-auto p-3">
                    <div className="flex items-center gap-3">
                      <a
                        href={`tel:${response.phone}`}
                        className="text-sm font-medium hover:underline transition-colors font-mono"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {formattedPhone}
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyPhone}
                        className={`
                          p-1.5 rounded-md transition-all duration-200
                          ${
                            copiedPhone
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "hover:bg-accent text-muted-foreground hover:text-foreground"
                          }
                        `}
                        aria-label={
                          copiedPhone ? "Скопировано" : "Скопировать телефон"
                        }
                      >
                        {copiedPhone ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
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
                  <HoverCardContent side="right" className="w-auto p-3">
                    <div className="flex items-center gap-3">
                      <a
                        href={`mailto:${response.email}`}
                        className="text-sm font-medium hover:underline break-all transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {response.email}
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyEmail}
                        className={`
                          p-1.5 rounded-md transition-all duration-200 shrink-0
                          ${
                            copiedEmail
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "hover:bg-accent text-muted-foreground hover:text-foreground"
                          }
                        `}
                        aria-label={
                          copiedEmail ? "Скопировано" : "Скопировать email"
                        }
                      >
                        {copiedEmail ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
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
        {response.screening?.overallScore != null ? (
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">
              {response.screening.overallScore}
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
              candidateName={candidateName}
              workspaceId={workspaceId}
              resumeUrl={response.resumeUrl}
              telegramUsername={response.telegramUsername}
              phone={response.phone}
              welcomeSentAt={response.welcomeSentAt}
              onSendWelcome={async () => {
                // TODO: Реализовать отправку приветствия
                console.log("Отправка приветствия для отклика:", response.id);
              }}
              onAnalyzeClick={() =>
                onAnalyzeClick?.(response.id, candidateName)
              }
            />
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
