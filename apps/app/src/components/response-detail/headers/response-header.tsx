"use client";

import {
  HR_SELECTION_STATUS_LABELS,
  type HrSelectionStatus,
  RESPONSE_STATUS_LABELS,
  type ResponseStatus,
} from "@qbs-autonaim/db/schema";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
} from "@qbs-autonaim/ui";
import { Award, Briefcase, Calendar, Phone, Send } from "lucide-react";
import { useAvatarUrl } from "~/hooks/use-avatar-url";
import { getAvatarUrl, getInitials } from "~/lib/avatar";
import { ResumeActions } from "../actions/resume-actions";
import { getScoreColor } from "../utils";

interface ResponseHeaderProps {
  response: {
    candidateName: string | null;
    status: ResponseStatus;
    hrSelectionStatus: HrSelectionStatus | null;
    phone: string | null;
    telegramUsername: string | null;
    createdAt: Date | string;
    resumeUrl: string | null;
    resumePdfUrl: string | null;
    photoFileId: string | null;
    vacancy?: {
      title: string;
    } | null;
    screening?: {
      detailedScore: number;
    } | null;
  };
}

export function ResponseHeader({ response }: ResponseHeaderProps) {
  const photoUrl = useAvatarUrl(response.photoFileId);
  const candidateName = response.candidateName || "Кандидат";
  const avatarUrl = getAvatarUrl(photoUrl, candidateName);

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="pb-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/10 sm:h-20 sm:w-20">
              <AvatarImage src={avatarUrl} alt={candidateName} />
              <AvatarFallback className="bg-primary/10 text-lg font-semibold">
                {getInitials(candidateName)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <CardTitle className="text-2xl sm:text-3xl">
                {response.candidateName || "Имя не указано"}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 text-base">
                <Briefcase className="h-4 w-4" />
                {response.vacancy?.title || "Вакансия"}
              </CardDescription>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1">
                  {RESPONSE_STATUS_LABELS[response.status]}
                </Badge>
                {response.hrSelectionStatus && (
                  <Badge variant="secondary" className="gap-1">
                    {HR_SELECTION_STATUS_LABELS[response.hrSelectionStatus]}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {response.screening?.detailedScore !== undefined && (
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Общая оценка
                </span>
              </div>
              <div
                className={`text-4xl font-bold ${getScoreColor(response.screening.detailedScore)}`}
              >
                {response.screening.detailedScore}
                <span className="text-2xl text-muted-foreground">/100</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-0">
        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          {response.phone && (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Телефон</p>
                <p className="truncate font-medium">{response.phone}</p>
              </div>
            </div>
          )}
          {response.telegramUsername && (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Send className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Telegram</p>
                <p className="truncate font-medium">
                  @{response.telegramUsername}
                </p>
              </div>
            </div>
          )}
          {response.createdAt && (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Дата отклика</p>
                <p className="truncate font-medium">
                  {new Date(response.createdAt).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        {response.resumeUrl && (
          <ResumeActions
            resumeUrl={response.resumeUrl}
            resumePdfUrl={response.resumePdfUrl}
          />
        )}
      </CardContent>
    </Card>
  );
}