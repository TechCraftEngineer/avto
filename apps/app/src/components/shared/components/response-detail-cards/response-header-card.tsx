"use client";

import type { GlobalCandidate } from "@qbs-autonaim/db/schema";
import { calculateAge, formatBirthDate } from "@qbs-autonaim/lib/utils";
import { getInitials } from "@qbs-autonaim/shared";
import { hasExperience as checkExperience } from "@qbs-autonaim/shared/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@qbs-autonaim/ui/components/avatar";
import { Badge } from "@qbs-autonaim/ui/components/badge";
import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import { Separator } from "@qbs-autonaim/ui/components/separator";
import {
  Cake,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Star,
  User,
  XCircle,
} from "lucide-react";
import type {
  GigResponseDetail,
  VacancyResponseDetail,
} from "~/components/responses/types";
import { useAvatarUrl } from "~/hooks/use-avatar-url";
import { getAvatarUrl } from "~/lib/avatar";
import {
  formatDate,
  HR_STATUS_CONFIG,
  IMPORT_SOURCE_LABELS,
  STATUS_CONFIG,
} from "../../utils/constants";

interface ResponseHeaderCardProps {
  response: (GigResponseDetail | VacancyResponseDetail) & {
    globalCandidate?: GlobalCandidate | null;
    interviewScoring?: {
      score: number;
      detailedScore?: number;
      analysis: string | null;
    } | null;
    conversation?: {
      id: string;
      status: string;
      messages: Array<{
        id: string;
        sender: string;
        content: string;
        contentType: string;
        voiceTranscription: string | null;
        createdAt: Date;
      }>;
    } | null;
  };
  onAccept?: () => void;
  onReject?: () => void;
  onMessage?: () => void;
  onEvaluate?: () => void;
  isProcessing?: boolean;
  isPolling?: boolean;
}

export function ResponseHeaderCard({
  response,
  onAccept,
  onReject,
  onMessage,
  onEvaluate,
  isProcessing,
  isPolling,
}: ResponseHeaderCardProps) {
  const statusConfig = STATUS_CONFIG[response.status];
  const StatusIcon = statusConfig?.icon;

  // Получаем URL аватарки: photoFileId → kworkAvatarUrl (из dialogs) → fallback на инициалы
  const photoUrl = useAvatarUrl(
    "photoFileId" in response ? response.photoFileId : null,
  );
  const profileData = response.profileData as
    | { kworkAvatarUrl?: string }
    | null
    | undefined;
  const fallbackAvatar =
    !photoUrl && profileData?.kworkAvatarUrl
      ? profileData.kworkAvatarUrl
      : photoUrl;
  const candidateName = response.candidateName || response.candidateId;
  const avatarUrl = getAvatarUrl(fallbackAvatar, candidateName);
  const initials = getInitials(candidateName);

  const hasConversation =
    !!response.conversation && response.conversation.messages.length > 0;

  // Проверяем, есть ли данные для оценки (портфолио, опыт, профиль)
  const hasEvaluationData =
    checkExperience(response.profileData) ||
    !!response.profileData ||
    (!!response.portfolioLinks && response.portfolioLinks.length > 0) ||
    !!response.portfolioFileId ||
    !!response.coverLetter;

  // Показываем кнопку оценки только если:
  // 1. Есть диалог с сообщениями ИЛИ есть данные для оценки
  // 2. Нет результатов оценки
  const canEvaluate = hasConversation || hasEvaluationData;

  // Вычисляем возраст и форматируем дату рождения
  const birthDate = "birthDate" in response ? response.birthDate : null;
  const age = birthDate ? calculateAge(birthDate) : null;
  const birthDateFormatted = birthDate ? formatBirthDate(birthDate) : null;

  // Получаем локацию
  const location = response.globalCandidate?.location ?? null;

  // Получаем контакты
  const phone = "phone" in response ? response.phone : null;
  const email = "email" in response ? response.email : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full min-w-0">
            <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 border-primary/10 shrink-0">
              <AvatarImage src={avatarUrl} alt={candidateName} />
              <AvatarFallback className="bg-primary/10 text-sm sm:text-lg font-semibold">
                {initials || <User className="h-6 w-6 sm:h-8 sm:w-8" />}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg sm:text-2xl mb-1.5 sm:mb-2 wrap-break-word">
                {candidateName}
              </CardTitle>

              {/* Основная информация о кандидате */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mb-2">
                {age !== null && (
                  <div className="flex items-center gap-1.5">
                    <Cake className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    <span className="whitespace-nowrap">
                      {age} {age === 1 ? "год" : age < 5 ? "года" : "лет"}
                    </span>
                  </div>
                )}

                {birthDateFormatted && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    <span className="whitespace-nowrap">
                      {birthDateFormatted}
                    </span>
                  </div>
                )}

                {location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    <span className="truncate max-w-[200px]">{location}</span>
                  </div>
                )}
              </div>

              {/* Контактная информация */}
              {(phone || email) && (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mb-2">
                  {phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      <span className="whitespace-nowrap">{phone}</span>
                    </div>
                  )}

                  {email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      <span className="truncate max-w-[250px]">{email}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Дополнительная информация */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="whitespace-nowrap">
                    Откликнулся{" "}
                    {formatDate(response.respondedAt || response.createdAt)}
                  </span>
                </div>

                {response.rating && (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400 shrink-0" />
                    <span className="font-medium text-foreground">
                      {response.rating}
                    </span>
                  </div>
                )}

                {response.importSource &&
                  response.importSource !== "MANUAL" && (
                    <div className="flex items-center gap-1.5">
                      <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      <span className="whitespace-nowrap">
                        {IMPORT_SOURCE_LABELS[response.importSource]}
                      </span>
                    </div>
                  )}
              </div>
            </div>
          </div>

          <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 shrink-0 w-full sm:w-auto">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <Badge
                variant={statusConfig.variant}
                className="gap-1 sm:gap-1.5 text-xs sm:text-sm"
              >
                {StatusIcon && (
                  <StatusIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                )}
                {statusConfig.label}
              </Badge>

              {response.hrSelectionStatus && (
                <Badge
                  variant={HR_STATUS_CONFIG[response.hrSelectionStatus].variant}
                  className="text-xs sm:text-sm"
                >
                  {HR_STATUS_CONFIG[response.hrSelectionStatus].label}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <Separator className="mx-6" />

      {/* Quick Actions */}
      <CardContent>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          {onAccept && (
            <Button
              onClick={onAccept}
              disabled={isProcessing}
              size="sm"
              className="gap-2 w-full sm:w-auto min-h-[44px] sm:min-h-[36px] touch-manipulation"
            >
              <CheckCircle2 className="h-4 w-4" />
              Принять
            </Button>
          )}

          {onMessage && (
            <Button
              onClick={onMessage}
              disabled={isProcessing}
              variant="outline"
              size="sm"
              className="gap-2 w-full sm:w-auto min-h-[44px] sm:min-h-[36px] touch-manipulation"
            >
              <MessageSquare className="h-4 w-4" />
              Написать
            </Button>
          )}

          {onEvaluate && canEvaluate && (
            <Button
              onClick={onEvaluate}
              disabled={isProcessing || isPolling}
              variant="outline"
              size="sm"
              className="gap-2 w-full sm:w-auto min-h-[44px] sm:min-h-[36px] touch-manipulation"
            >
              {isPolling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Обработка…
                </>
              ) : (
                <>
                  <Star className="h-4 w-4" />
                  Оценить кандидата
                </>
              )}
            </Button>
          )}

          {onReject && (
            <Button
              onClick={onReject}
              disabled={isProcessing}
              variant="ghost"
              size="sm"
              className="gap-2 w-full sm:w-auto min-h-[44px] sm:min-h-[36px] touch-manipulation"
            >
              <XCircle className="h-4 w-4" />
              Отклонить
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
