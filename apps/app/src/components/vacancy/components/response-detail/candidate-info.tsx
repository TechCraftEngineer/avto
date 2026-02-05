import { calculateAge, formatBirthDate } from "@qbs-autonaim/lib";
import { getInitials } from "@qbs-autonaim/shared";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  CardTitle,
} from "@qbs-autonaim/ui";
import { Cake, Calendar, FileText, MapPin, User, Wallet } from "lucide-react";
import { useAvatarUrl } from "~/hooks/use-avatar-url";
import { getAvatarUrl } from "~/lib/avatar";
import { CandidateMetrics } from "./candidate-metrics";
import { ContactItem } from "./contact-item";
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
  lastActivity: string;
}

export function CandidateInfo({
  response,
  matchScore,
  candidateRank,
  responseTime,
  lastActivity,
}: CandidateInfoProps) {
  const photoUrl = useAvatarUrl(response.photoFileId);
  const candidateName = response.candidateName || "Кандидат";
  const avatarUrl = getAvatarUrl(photoUrl, candidateName);
  const initials = getInitials(candidateName);

  const age = response.birthDate ? calculateAge(response.birthDate) : null;
  const birthDateFormatted = response.birthDate
    ? formatBirthDate(response.birthDate)
    : null;
  // В детальном просмотре нет globalCandidate, только globalCandidateId
  const location = null;

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
          {response.candidateName || "Кандидат"}
        </CardTitle>

        {/* Основная информация о кандидате */}
        <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
          {age !== null && (
            <div className="flex items-center gap-1.5">
              <Cake className="h-3.5 w-3.5 shrink-0" />
              <span>
                {age} {age === 1 ? "год" : age < 5 ? "года" : "лет"}
              </span>
            </div>
          )}

          {birthDateFormatted && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{birthDateFormatted}</span>
            </div>
          )}

          {location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-[200px]">{location}</span>
            </div>
          )}
        </div>

        {/* Контактная информация */}
        {(response.phone || response.email) && (
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {response.phone && (
              <ContactItem type="phone" value={response.phone} />
            )}

            {response.email && (
              <ContactItem type="email" value={response.email} />
            )}
          </div>
        )}

        {/* Бейджи со статусами и дополнительной информацией */}
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
          {response.resumeId && (
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
            >
              <FileText className="h-3 w-3 mr-1" />
              Есть резюме
            </Badge>
          )}
          {response.salaryExpectationsAmount && (
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
            >
              <Wallet className="h-3 w-3 mr-1" />
              {response.salaryExpectationsAmount.toLocaleString()}&nbsp;₽
            </Badge>
          )}
        </div>

        <CandidateMetrics
          matchScore={matchScore}
          candidateRank={candidateRank}
          responseTime={responseTime}
          lastActivity={lastActivity}
        />

        <div className="text-sm text-muted-foreground mt-3">
          Откликнулся{" "}
          {new Date(
            response.respondedAt || response.createdAt,
          ).toLocaleDateString("ru-RU")}
        </div>
      </div>
    </div>
  );
}
