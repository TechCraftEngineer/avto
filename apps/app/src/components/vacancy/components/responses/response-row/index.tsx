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
import { Badge, Checkbox, TableCell, TableRow } from "@qbs-autonaim/ui";
import Link from "next/link";
import { ResponseActions } from "~/components";
import { useAvatarUrl } from "~/hooks/use-avatar-url";
import { getAvatarUrl } from "~/lib/avatar";
import { ScreeningHoverCard } from "../../screening/screening-hover-card";
import { CandidateAvatar } from "./candidate-avatar";
import { CandidateBadges } from "./candidate-badges";
import { CandidateInfo } from "./candidate-info";
import { CoverLetterCell } from "./cover-letter-cell";
import { ScoreCell } from "./score-cell";

interface ResponseRowProps {
  response: RouterOutputs["vacancy"]["responses"]["list"]["responses"][0];
  orgSlug: string;
  workspaceSlug: string;
  workspaceId: string;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  vacancyId?: string;
}

export function ResponseRow({
  response,
  orgSlug,
  workspaceSlug,
  workspaceId,
  isSelected = false,
  onSelect,
  vacancyId,
}: ResponseRowProps) {
  const photoUrl = useAvatarUrl(response.photoFileId);
  const candidateName = response.candidateName || "Кандидат";
  const avatarUrl = getAvatarUrl(photoUrl, candidateName);
  const initials = getInitials(candidateName);
  const age = response.birthDate ? calculateAge(response.birthDate) : null;
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
          <CandidateAvatar
            avatarUrl={avatarUrl}
            candidateName={candidateName}
            initials={initials}
          />
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
              <CandidateBadges
                response={response}
                orgSlug={orgSlug}
                workspaceSlug={workspaceSlug}
              />
            </div>
            <CandidateInfo
              age={age}
              birthDate={response.birthDate}
              location={location}
              phone={response.phone}
              email={response.email}
            />
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
        <ScoreCell score={response.priorityScore} />
      </TableCell>

      <TableCell>
        {response.screening ? (
          <ScreeningHoverCard screening={response.screening} />
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </TableCell>

      <TableCell>
        <ScoreCell score={response.screening?.potentialScore} />
      </TableCell>

      <TableCell>
        <ScoreCell score={response.screening?.careerTrajectoryScore} />
      </TableCell>

      <TableCell>
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
        <span className="text-muted-foreground text-xs">—</span>
      </TableCell>

      <TableCell>
        <ScoreCell score={response.screening?.score} maxScore={100} />
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
        <CoverLetterCell coverLetter={response.coverLetter} />
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
                console.log("Отправка приветствия для отклика:", response.id);
              }}
            />
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
