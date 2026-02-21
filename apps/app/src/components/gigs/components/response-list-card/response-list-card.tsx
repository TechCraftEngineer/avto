"use client";

import type { GigResponseListItem } from "~/components/responses/types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Progress,
  Separator,
} from "@qbs-autonaim/ui";
import {
  Award,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  MessageSquare,
  Star,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import {
  formatCurrency,
  formatDate,
  HR_STATUS_CONFIG,
  IMPORT_SOURCE_LABELS,
  RESPONSE_STATUS_CONFIG,
} from "~/lib/shared/response-configs";

interface ResponseListCardProps {
  response: GigResponseListItem;
  orgSlug: string;
  workspaceSlug: string;
  gigId: string;
  onAccept?: (responseId: string) => void;
  onReject?: (responseId: string) => void;
  onMessage?: (responseId: string) => void;
}

export function ResponseListCard({
  response,
  orgSlug,
  workspaceSlug,
  gigId,
  onAccept,
  onReject,
  onMessage,
}: ResponseListCardProps) {
  const statusConfig = RESPONSE_STATUS_CONFIG[response.status];
  const StatusIcon = statusConfig.icon;
  const hasScreening = !!response.screening;
  const hasInterviewScoring = !!response.interviewScoring;

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  return (
    <Link
      href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/responses/${response.id}`}
    >
      <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-0.5">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            {/* Avatar & Main Info */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-2 ring-background group-hover:bg-primary/20 group-hover:ring-primary/20 transition-all duration-300">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-background ring-2 ring-background">
                  <StatusIcon className="h-3 w-3 text-primary" />
                </div>
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base text-foreground truncate">
                    {response.candidateName || response.candidateId}
                  </h3>
                  {response.rating && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {response.rating}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="text-xs">
                      {formatDate(response.respondedAt || response.createdAt)}
                    </span>
                  </div>

                  {response.importSource &&
                    response.importSource !== "MANUAL" && (
                      <>
                        <Separator orientation="vertical" className="h-3" />
                        <div className="flex items-center gap-1.5">
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span className="text-xs">
                            {IMPORT_SOURCE_LABELS[response.importSource]}
                          </span>
                        </div>
                      </>
                    )}
                </div>
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <Badge
                variant={statusConfig.variant}
                className="gap-1.5 text-xs font-medium px-2 py-1"
              >
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
              </Badge>

              {response.hrSelectionStatus && (
                <Badge
                  variant={
                    HR_STATUS_CONFIG[response.hrSelectionStatus]?.variant ||
                    "secondary"
                  }
                  className="text-xs px-2 py-0.5"
                >
                  {HR_STATUS_CONFIG[response.hrSelectionStatus]?.label ||
                    response.hrSelectionStatus}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Scores Section */}
          {(hasScreening || hasInterviewScoring) && (
            <div className="space-y-3">
              {hasScreening && (
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group/score">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover/score:bg-primary/20 transition-colors">
                        <Award className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">
                            Скрининг
                          </span>
                          <span className="text-sm font-bold text-primary">
                            {(response.screening.overallScore / 20).toFixed(1)}
                            /5
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={response.screening.overallScore}
                            className="flex-1 h-1.5"
                          />
                          <span className="text-xs text-muted-foreground font-medium">
                            {response.screening.overallScore}
                          </span>
                        </div>
                      </div>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent
                    className="w-80"
                    align="start"
                    side="bottom"
                  >
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm">
                          Результаты скрининга
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Автоматическая оценка соответствия требованиям
                        </p>
                      </div>
                      {response.screening.overallAnalysis && (
                        <div>
                          <h5 className="font-medium text-xs mb-1">Анализ</h5>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {response.screening.overallAnalysis}
                          </p>
                        </div>
                      )}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              )}

              {hasInterviewScoring && response.interviewScoring && (
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group/score">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover/score:bg-primary/20 transition-colors">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">
                            Интервью
                          </span>
                          <span className="text-sm font-bold text-primary">
                            {response.interviewScoring.score}/5
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={
                              response.interviewScoring.rating != null
                                ? response.interviewScoring.rating * 20
                                : response.interviewScoring.score
                            }
                            className="flex-1 h-1.5"
                          />
                          <span className="text-xs text-muted-foreground font-medium">
                            {response.interviewScoring.rating != null
                              ? response.interviewScoring.rating * 20
                              : response.interviewScoring.score}
                          </span>
                        </div>
                      </div>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent
                    className="w-80"
                    align="start"
                    side="bottom"
                  >
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm">
                          Результаты интервью
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Оценка кандидата на основе AI-интервью
                        </p>
                      </div>
                      {response.interviewScoring.analysis && (
                        <div>
                          <h5 className="font-medium text-xs mb-1">Анализ</h5>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {response.interviewScoring.analysis}
                          </p>
                        </div>
                      )}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              )}
            </div>
          )}

          {/* Parsed Profile Indicator */}
          {response.profileData && !response.profileData.error && (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-green-900 dark:text-green-100">
                  Портфолио распарсено
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">
                  {response.profileData.platform || "Не указан"} •{" "}
                  {response.profileData.username || "—"}
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          {(response.proposedPrice || response.proposedDeliveryDays) && (
            <div className="grid grid-cols-2 gap-3">
              {response.proposedPrice && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Banknote className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      Цена
                    </div>
                    <div className="font-semibold text-sm truncate">
                      {formatCurrency(response.proposedPrice)}
                    </div>
                  </div>
                </div>
              )}

              {response.proposedDeliveryDays && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      Срок
                    </div>
                    <div className="font-semibold text-sm truncate">
                      {response.proposedDeliveryDays}{" "}
                      {response.proposedDeliveryDays === 1
                        ? "день"
                        : response.proposedDeliveryDays < 5
                          ? "дня"
                          : "дней"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cover Letter Preview */}
          {response.coverLetter && (
            <div className="p-4 rounded-xl border border-border/50 bg-card">
              <div className="flex items-start gap-3 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="font-medium text-sm text-foreground">
                    Сопроводительное письмо
                  </h4>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pl-11 line-clamp-3">
                {response.coverLetter}
              </p>
            </div>
          )}

          {/* Actions */}
          {(onAccept || onMessage || onReject) && (
            <>
              <Separator className="my-4" />
              <div className="flex items-center gap-2">
                {onAccept && (
                  <Button
                    size="sm"
                    variant="default"
                    className="gap-2 h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                    onClick={(e) =>
                      handleAction(e, () => onAccept(response.id))
                    }
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Принять
                  </Button>
                )}

                {onMessage && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 h-9 px-4 border-border hover:bg-muted"
                    onClick={(e) =>
                      handleAction(e, () => onMessage(response.id))
                    }
                  >
                    <MessageSquare className="h-4 w-4" />
                    Написать
                  </Button>
                )}

                {onReject && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-2 h-9 px-4 ml-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) =>
                      handleAction(e, () => onReject(response.id))
                    }
                  >
                    <XCircle className="h-4 w-4" />
                    Отклонить
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
