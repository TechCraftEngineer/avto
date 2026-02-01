"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
} from "@qbs-autonaim/ui";
import { skipToken, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Award,
  Bot,
  Edit,
  MessageSquare,
  Share2,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

type ShortlistCandidate =
  RouterOutputs["gig"]["shortlist"]["candidates"][number];

interface TopCandidatesPreviewProps {
  candidates: ShortlistCandidate[];
  orgSlug: string;
  workspaceSlug: string;
  gigId: string;
}

function TopCandidatesPreview({
  candidates,
  orgSlug,
  workspaceSlug,
  gigId,
}: TopCandidatesPreviewProps) {
  if (candidates.length === 0) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case "HIGHLY_RECOMMENDED":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30";
      case "RECOMMENDED":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30";
      case "NEUTRAL":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30";
      default:
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <TrendingUp className="h-4 w-4" />
        Топ-кандидаты по версии AI
      </div>

      <div className="grid gap-2">
        {candidates.slice(0, 3).map((candidate, index) => (
          <div
            key={candidate.responseId}
            className="flex items-start gap-3 p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                {index + 1}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h4 className="font-medium text-sm truncate">
                  {candidate.name}
                </h4>
                <Badge
                  variant="outline"
                  className={`text-xs px-2 py-0.5 ${getRecommendationColor(candidate.recommendation)} border-current`}
                >
                  {candidate.recommendation === "HIGHLY_RECOMMENDED" &&
                    "Настоятельно"}
                  {candidate.recommendation === "RECOMMENDED" &&
                    "Рекомендуется"}
                  {candidate.recommendation === "NEUTRAL" && "Нейтрально"}
                  {candidate.recommendation === "NOT_RECOMMENDED" &&
                    "Не рекомендуется"}
                </Badge>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                <span
                  className={`font-semibold ${getScoreColor(candidate.compositeScore)}`}
                >
                  {candidate.compositeScore} баллов
                </span>
                {candidate.proposedPrice && (
                  <span>
                    {candidate.proposedPrice.toLocaleString("ru-RU")} ₽
                  </span>
                )}
                {candidate.proposedDeliveryDays && (
                  <span>{candidate.proposedDeliveryDays} дней</span>
                )}
              </div>

              {candidate.strengths.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-green-600 dark:text-green-400">
                    Почему подходит:
                  </span>{" "}
                  {candidate.strengths.slice(0, 2).join(", ")}
                  {candidate.strengths.length > 2 && "..."}
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              asChild
              className="shrink-0 h-8 w-8 p-0 hover:bg-primary/10"
            >
              <Link
                href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/responses/${candidate.responseId}`}
                title="Открыть профиль кандидата"
              >
                <Users className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        asChild
        className="w-full text-xs hover:bg-primary/5 text-primary"
      >
        <Link
          href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/shortlist`}
        >
          <Star className="h-3 w-3 mr-2" />
          Посмотреть полный шортлист ({candidates.length} кандидатов)
        </Link>
      </Button>
    </div>
  );
}

interface CandidateAssessmentSummaryProps {
  candidates: ShortlistCandidate[];
  responseCounts?: { total: number; new: number } | null;
}

function CandidateAssessmentSummary({
  candidates,
  responseCounts,
}: CandidateAssessmentSummaryProps) {
  const totalResponses = responseCounts?.total ?? 0;
  const newResponses = responseCounts?.new ?? 0;

  // Вычисляем статистику по кандидатам
  const highRecommendedCount = candidates.filter(
    (c) => c.recommendation === "HIGHLY_RECOMMENDED",
  ).length;
  const recommendedCount = candidates.filter(
    (c) => c.recommendation === "RECOMMENDED",
  ).length;
  const averageScore =
    candidates.length > 0
      ? Math.round(
          candidates.reduce((sum, c) => sum + c.compositeScore, 0) /
            candidates.length,
        )
      : 0;

  const getOverallAssessment = () => {
    if (candidates.length === 0) {
      return {
        text: "Недостаточно данных для оценки",
        color: "text-muted-foreground",
        icon: AlertCircle,
        bgColor: "bg-muted/50",
      };
    }

    if (averageScore >= 80 && highRecommendedCount >= 2) {
      return {
        text: "Отличный пул кандидатов",
        color: "text-green-600 dark:text-green-400",
        icon: Award,
        bgColor: "bg-green-50 dark:bg-green-950/30",
      };
    }

    if (
      averageScore >= 60 &&
      (highRecommendedCount > 0 || recommendedCount > 0)
    ) {
      return {
        text: "Хороший выбор кандидатов",
        color: "text-blue-600 dark:text-blue-400",
        icon: Target,
        bgColor: "bg-blue-50 dark:bg-blue-950/30",
      };
    }

    if (averageScore >= 40) {
      return {
        text: "Средний уровень кандидатов",
        color: "text-yellow-600 dark:text-yellow-400",
        icon: TrendingUp,
        bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
      };
    }

    return {
      text: "Низкий уровень кандидатов",
      color: "text-red-600 dark:text-red-400",
      icon: AlertCircle,
      bgColor: "bg-red-50 dark:bg-red-950/30",
    };
  };

  const assessment = getOverallAssessment();
  const IconComponent = assessment.icon;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Target className="h-4 w-4" />
        Оценка кандидатов
      </div>

      {/* Общая оценка */}
      <div className="p-3 rounded-md border bg-card">
        <div className="flex items-center gap-2">
          <IconComponent className={`h-4 w-4 ${assessment.color}`} />
          <span className={`font-medium ${assessment.color}`}>
            {assessment.text}
          </span>
        </div>
      </div>

      {/* Детальная статистика */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2 p-2 rounded-md border bg-card">
          <Users className="h-3 w-3 text-muted-foreground" />
          <div>
            <div className="font-medium">{totalResponses}</div>
            <div className="text-muted-foreground">
              {newResponses > 0 && (
                <span className="text-orange-600 dark:text-orange-400 font-medium">
                  +{newResponses} новых
                </span>
              )}
              {newResponses === 0 && "всего откликов"}
            </div>
          </div>
        </div>

        {candidates.length > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-md border bg-card">
            <Star className="h-3 w-3 text-muted-foreground" />
            <div>
              <div className="font-medium">{averageScore}</div>
              <div className="text-muted-foreground">средний балл</div>
            </div>
          </div>
        )}

        {highRecommendedCount > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-md border bg-card col-span-2">
            <Award className="h-3 w-3 text-muted-foreground" />
            <div>
              <div className="font-medium">{highRecommendedCount}</div>
              <div className="text-muted-foreground">
                настоятельно рекомендуемых
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface GigDetailActionsProps {
  gig: {
    title: string;
  };
  orgSlug: string;
  workspaceSlug: string;
  gigId: string;
  responseCounts?: { total: number; new: number } | null;
  onShare: () => void;
}

export function GigDetailActions({
  gig: _gig,
  orgSlug,
  workspaceSlug,
  gigId,
  responseCounts,
  onShare,
}: GigDetailActionsProps) {
  const trpc = useTRPC();
  const { workspace } = useWorkspace();

  // Получаем топ-3 кандидатов для краткого превью
  const { data: topCandidatesData } = useQuery(
    trpc.gig.shortlist.queryOptions(
      workspace?.id
        ? {
            gigId,
            workspaceId: workspace.id,
            minScore: 70,
            maxCandidates: 3, // Только топ-3 кандидата
            includeOnlyHighlyRecommended: false,
            prioritizeBudgetFit: false,
          }
        : skipToken,
    ),
  );

  const topCandidates = topCandidatesData?.candidates ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Действия с заданием
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Основные действия */}
        <div className="space-y-3">
          <Button asChild className="w-full justify-start h-12">
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/chat`}
              className="flex items-center"
            >
              <Bot className="h-5 w-5 mr-3" aria-hidden="true" />
              <div className="flex flex-col items-start flex-1">
                <span className="font-medium">AI Помощник</span>
                <span className="text-xs text-muted-foreground">
                  Умный анализ кандидатов
                </span>
              </div>
              <Badge variant="secondary" className="ml-auto">
                Новинка
              </Badge>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full justify-start h-12"
          >
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/responses`}
              className="flex items-center"
            >
              <MessageSquare className="h-5 w-5 mr-3" aria-hidden="true" />
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="font-medium">Отклики</span>
                <span className="text-xs text-muted-foreground">
                  Все отклики кандидатов
                </span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                {responseCounts?.total !== undefined && (
                  <Badge variant="secondary">
                    <Users className="h-3 w-3 mr-1" />
                    {responseCounts.total}
                  </Badge>
                )}
                {responseCounts?.new !== undefined &&
                  responseCounts.new > 0 && (
                    <Badge variant="destructive">
                      <TrendingUp className="h-3 w-3 mr-1" />+
                      {responseCounts.new}
                    </Badge>
                  )}
              </div>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full justify-start h-12"
          >
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/shortlist`}
              className="flex items-center"
            >
              <Star className="h-5 w-5 mr-3" aria-hidden="true" />
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="font-medium">Шортлист кандидатов</span>
                <span className="text-xs text-muted-foreground">
                  Лучшие кандидаты по AI
                </span>
              </div>
            </Link>
          </Button>
        </div>

        {/* Краткий вывод оценки кандидатов */}
        <CandidateAssessmentSummary
          candidates={topCandidates}
          responseCounts={responseCounts}
        />

        {/* Топ-кандидаты превью */}
        {topCandidates.length > 0 && (
          <>
            <Separator />
            <TopCandidatesPreview
              candidates={topCandidates}
              orgSlug={orgSlug}
              workspaceSlug={workspaceSlug}
              gigId={gigId}
            />
          </>
        )}

        <Separator />

        {/* Второстепенные действия */}
        <div className="space-y-3">
          <Button
            variant="outline"
            asChild
            className="w-full justify-start h-11"
          >
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/edit`}
              className="flex items-center"
            >
              <Edit className="h-4 w-4 mr-3" aria-hidden="true" />
              <div className="flex flex-col items-start flex-1">
                <span className="font-medium">Редактировать задание</span>
                <span className="text-xs text-muted-foreground">
                  Изменить условия
                </span>
              </div>
            </Link>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-11"
            onClick={onShare}
          >
            <Share2 className="h-4 w-4 mr-3" aria-hidden="true" />
            <div className="flex flex-col items-start flex-1">
              <span className="font-medium">Поделиться ссылкой</span>
              <span className="text-xs text-muted-foreground">
                Отправить кандидатам
              </span>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
