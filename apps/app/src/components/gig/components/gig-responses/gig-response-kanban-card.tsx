"use client";

import { CandidateAvatar } from "@qbs-autonaim/ui/components/candidate-avatar";
import { Badge } from "@qbs-autonaim/ui/components/reui/badge";
import { cn } from "@qbs-autonaim/ui/utils";
import { IconMessageCircle, IconStar } from "@tabler/icons-react";
import type { GigResponseListItem } from "~/components/responses/types";
import { useAvatarUrl } from "~/hooks/use-avatar-url";
import { getAvatarUrl } from "~/lib/avatar";

interface GigResponseKanbanCardProps {
  response: GigResponseListItem;
  onClick: () => void;
  isDragging?: boolean;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function GigResponseKanbanCard({
  response,
  onClick,
  isDragging = false,
}: GigResponseKanbanCardProps) {
  const score = (() => {
    if (response.interviewScoring) {
      const { rating, score: rawScore } = response.interviewScoring;
      if (typeof rating === "number" && Number.isFinite(rating)) return rating;
      if (typeof rawScore === "number" && Number.isFinite(rawScore))
        return Math.round(rawScore / 20);
    }
    if (response.screening) {
      const overallScore = response.screening.overallScore;
      if (typeof overallScore === "number" && Number.isFinite(overallScore))
        return overallScore / 20;
    }
    return null;
  })();
  const coverPreview = response.coverLetter
    ? stripHtml(response.coverLetter).slice(0, 65)
    : null;
  const photoUrl = useAvatarUrl(response.photoFileId);
  const avatarUrl = getAvatarUrl(photoUrl, response.candidateName ?? "");

  const getBorderColor = () => {
    if (score === null || score === undefined) return "border-l-border";
    if (score >= 4) return "border-l-green-500 border-l-4";
    if (score >= 3) return "border-l-emerald-500 border-l-4";
    if (score >= 2) return "border-l-yellow-500 border-l-4";
    if (score >= 1) return "border-l-orange-500 border-l-4";
    return "border-l-red-500 border-l-4";
  };

  return (
    <div
      className={cn(
        "w-full min-w-0 max-w-full flex flex-col group relative rounded-lg border border-border bg-card shadow-sm overflow-hidden",
        getBorderColor(),
        isDragging
          ? "transition-none shadow-lg scale-105"
          : "transition-shadow duration-200 hover:shadow-md hover:border-primary/40",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          {score !== null && score !== undefined && (
            <Badge
              variant={score >= 3 ? "success" : "secondary"}
              size="sm"
              className="shrink-0"
            >
              <IconStar className="size-3 mr-1" />
              {score.toFixed(1)}
            </Badge>
          )}
        </div>
      </div>

      <button
        onClick={onClick}
        aria-label={`Открыть отклик${response.candidateName ? ` от ${response.candidateName}` : ""}`}
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
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              {response.interviewScoring && (
                <Badge variant="info-light" size="sm" className="text-xs">
                  <IconMessageCircle className="size-3 mr-0.5" />
                  Интервью
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
    </div>
  );
}
