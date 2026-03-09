import { calculateAge } from "@qbs-autonaim/lib/utils";
import { getInitials } from "@qbs-autonaim/shared";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@qbs-autonaim/ui/components/avatar";
import { Badge } from "@qbs-autonaim/ui/components/badge";
import { CardTitle } from "@qbs-autonaim/ui/components/card";
import { Cake, User } from "lucide-react";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useAvatarUrl } from "~/hooks/use-avatar-url";
import { getAvatarUrl } from "~/lib/avatar";
import { CandidateMetrics } from "./candidate-metrics";
import { ContactEditor } from "./contact-editor";
import {
  getImportSourceLabel,
  getStatusColor,
  getStatusLabel,
} from "./header-card-utils";
import type { VacancyResponse } from "./types";

interface CandidateInfoProps {
  response: VacancyResponse;
  matchScore: number;
  candidateRank: number;
  responseTime: string;
  workspaceId?: string;
}

export function CandidateInfo({
  response,
  matchScore,
  candidateRank,
  responseTime,
  workspaceId: workspaceIdProp,
}: CandidateInfoProps) {
  const { workspaceId: contextWorkspaceId } = useWorkspaceContext();
  const workspaceId =
    workspaceIdProp ??
    (response as { workspaceId?: string }).workspaceId ??
    contextWorkspaceId ??
    "";
  const photoUrl = useAvatarUrl(response.photoFileId);
  const candidateName = response.candidateName || "Кандидат";
  const avatarUrl = getAvatarUrl(photoUrl, candidateName);
  const initials = getInitials(candidateName);

  const age = response.birthDate ? calculateAge(response.birthDate) : null;

  return (
    <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
      <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 shrink-0">
        <AvatarImage src={avatarUrl} alt={candidateName} />
        <AvatarFallback className="text-sm sm:text-lg font-medium bg-muted text-muted-foreground">
          {initials || <User className="h-5 w-5 sm:h-7 sm:w-7" />}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <CardTitle className="text-lg sm:text-xl truncate">
          {candidateName}
        </CardTitle>

        {age !== null && (
          <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
            <Cake className="h-3.5 w-3.5 shrink-0" />
            <span>
              {age} {age === 1 ? "год" : age < 5 ? "года" : "лет"}
            </span>
          </div>
        )}

        {/* Контактная информация — рекрутер может добавлять и редактировать */}
        {workspaceId && (
          <ContactEditor response={response} workspaceId={workspaceId} />
        )}

        {/* Статус и источник — детали резюме и зарплаты в CandidateKeyInfo ниже */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Badge variant="outline" className={getStatusColor(response.status)}>
            {getStatusLabel(response.status)}
          </Badge>
          {response.importSource && response.importSource !== "MANUAL" && (
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800"
            >
              {getImportSourceLabel(response.importSource)}
            </Badge>
          )}
        </div>

        <CandidateMetrics
          matchScore={matchScore}
          candidateRank={candidateRank}
          responseTime={responseTime}
        />
      </div>
    </div>
  );
}
