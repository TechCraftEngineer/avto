"use client";

import { CandidateAvatar } from "@qbs-autonaim/ui/components/candidate-avatar";
import { Badge } from "@qbs-autonaim/ui/components/reui/badge";
import { cn } from "@qbs-autonaim/ui/utils";
import {
  IconClock,
  IconMessageCircle,
  IconSend,
  IconStar,
} from "@tabler/icons-react";
import { useAvatarUrl } from "~/hooks/use-avatar-url";
import { getAvatarUrl } from "~/lib/avatar";
import type { ResponseItem } from "./types";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

interface ResponseKanbanCardProps {
  response: ResponseItem;
  onClick: () => void;
  isDragging?: boolean;
  vacancyTitle?: string;
}

export function ResponseKanbanCard({
  response,
  onClick,
  isDragging = false,
  vacancyTitle,
}: ResponseKanbanCardProps) {
  const score = response.screening?.score;
  const hasInterview = response.interviewSession !== null;
  const messageCount = response.interviewSession?.messageCount ?? 0;
  const photoUrl = useAvatarUrl(response.photoFileId);
  const avatarUrl = getAvatarUrl(photoUrl, response.candidateName ?? "");
  const coverPreview = response.coverLetter
    ? stripHtml(response.coverLetter).slice(0, 65)
    : null;
  const hasWelcomeSent = response.welcomeSentAt !== null;
  const hasTelegram = !!response.telegramUsername;
  const hasPhone = !!response.phone;
  const contacts = response.contacts as {
    phone?: Array<{ raw?: string }>;
    email?: Array<{ raw?: string }>;
  } | null;
  const email =
    contacts?.email?.[0]?.raw ??
    (typeof contacts?.email?.[0] === "string" ? contacts.email[0] : null);

  // Определяем цвет границы по рейтингу (шкала 0-100)
  const getBorderColor = () => {
    if (score === null || score === undefined) return "border-l-border";
    if (score >= 80) return "border-l-green-500 border-l-4";
    if (score >= 60) return "border-l-emerald-500 border-l-4";
    if (score >= 40) return "border-l-yellow-500 border-l-4";
    if (score >= 20) return "border-l-orange-500 border-l-4";
    return "border-l-red-500 border-l-4";
  };

  return (
    <div
      className={cn(
        "w-full min-w-0 flex flex-col group relative rounded-lg border border-border bg-card shadow-sm",
        getBorderColor(),
        // Отключаем transition при перетаскивании для предотвращения конфликта с dnd-kit
        isDragging
          ? "transition-none shadow-lg scale-105"
          : "transition-shadow duration-200 hover:shadow-md hover:border-primary/40",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          {score !== null && score !== undefined && (
            <Badge
              variant={score >= 60 ? "success" : "secondary"}
              size="sm"
              className="shrink-0"
            >
              <IconStar className="size-3 mr-1" />
              {score.toFixed(0)}
            </Badge>
          )}
          {messageCount > 0 && (
            <div
              className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0"
              title={`${messageCount} сообщений в переписке`}
            >
              <IconMessageCircle className="size-3.5" />
              <span className="font-medium tabular-nums">{messageCount}</span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onClick}
        className="flex-1 p-3 cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-b-lg min-w-0"
        type="button"
      >
        <div className="flex gap-3">
          <CandidateAvatar
            name={response.candidateName}
            photoUrl={avatarUrl}
            photoFileId={response.photoFileId}
            className="size-10 shrink-0"
          />
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <h4 className="font-semibold text-sm leading-tight truncate">
              {response.candidateName || "Без имени"}
            </h4>
            {vacancyTitle && (
              <p className="text-xs text-muted-foreground truncate">
                {vacancyTitle}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <IconClock className="size-3 shrink-0" />
              <span className="truncate">
                {response.respondedAt
                  ? new Date(response.respondedAt).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                    })
                  : "Нет даты"}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              {hasInterview && (
                <Badge variant="info-light" size="sm" className="text-xs">
                  Интервью
                </Badge>
              )}
              {hasWelcomeSent && (
                <Badge variant="outline" size="sm" className="text-xs">
                  <IconSend className="size-3 mr-0.5" />
                  Приветствие
                </Badge>
              )}
            </div>
            {coverPreview && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {coverPreview}
                {response.coverLetter &&
                stripHtml(response.coverLetter).length > 65
                  ? "…"
                  : ""}
              </p>
            )}
          </div>
        </div>
      </button>

      {/* Quick contacts - visible on hover */}
      {(hasTelegram || hasPhone || email) && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-background/90 backdrop-blur-sm p-1 rounded-lg border shadow-sm z-10">
          {hasTelegram && (
            <a
              href={`https://t.me/${(response.telegramUsername ?? "").replace("@", "")}`}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-[#2AABEE] transition-colors"
              onClick={(e) => e.stopPropagation()}
              title={`Telegram: ${response.telegramUsername}`}
            >
              <svg
                role="img"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 fill-current"
              >
                <title>Telegram</title>
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 11.944 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </a>
          )}
          {email && (
            <a
              href={`mailto:${String(email)}`}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
              title={String(email)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <title>Email</title>
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </a>
          )}
          {hasPhone && (
            <a
              href={`tel:${response.phone}`}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-emerald-600 transition-colors"
              onClick={(e) => e.stopPropagation()}
              title={response.phone ?? ""}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <title>Телефон</title>
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
