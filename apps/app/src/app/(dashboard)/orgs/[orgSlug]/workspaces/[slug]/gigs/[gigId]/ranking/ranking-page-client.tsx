"use client";

import { Alert, AlertDescription, AlertTitle } from "@qbs-autonaim/ui/components/alert"
import { Badge } from "@qbs-autonaim/ui/components/badge"
import { Button } from "@qbs-autonaim/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@qbs-autonaim/ui/components/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@qbs-autonaim/ui/components/select"
import { Skeleton } from "@qbs-autonaim/ui/components/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Filter,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CandidateComparison, RankingList } from "~/components/gig";
import { useTRPC } from "~/trpc/react";
import type { GigRankedCandidate } from "~/types/api";


interface RankingPageClientProps {
  orgSlug: string;
  workspaceSlug: string;
  gigId: string;
}

const RECOMMENDATION_OPTIONS = [
  { value: "all", label: "Все рекомендации" },
  { value: "HIGHLY_RECOMMENDED", label: "Настоятельно рекомендован" },
  { value: "RECOMMENDED", label: "Рекомендован" },
  { value: "NEUTRAL", label: "Нейтрально" },
  { value: "NOT_RECOMMENDED", label: "Не рекомендован" },
] as const;

const MIN_SCORE_OPTIONS = [
  { value: "0", label: "Все оценки" },
  { value: "40", label: "От 40" },
  { value: "60", label: "От 60" },
  { value: "80", label: "От 80" },
] as const;

export function RankingPageClient({
  orgSlug,
  workspaceSlug,
  gigId,
}: RankingPageClientProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<string>("all");
  const [selectedMinScore, setSelectedMinScore] = useState<string>("0");
  const [showComparison, setShowComparison] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 20;

  // Fetch ranked candidates
  const {
    data: rankingData,
    isLoading,
    error,
  } = useQuery(
    trpc.gig.responses.ranked.queryOptions({
      gigId,
      workspaceId: workspaceSlug,
      recommendation:
        selectedRecommendation === "all"
          ? undefined
          : (selectedRecommendation as
              | "HIGHLY_RECOMMENDED"
              | "RECOMMENDED"
              | "NEUTRAL"
              | "NOT_RECOMMENDED"),
      minScore:
        selectedMinScore === "0"
          ? undefined
          : Number.parseInt(selectedMinScore, 10),
      limit,
      offset: page * limit,
    }),
  );

  // Recalculate ranking mutation
  const { mutate: recalculateRanking, isPending: isRecalculating } =
    useMutation(
      trpc.gig.responses.recalculateRanking.mutationOptions({
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: trpc.gig.responses.ranked.queryKey({
              gigId,
              workspaceId: workspaceSlug,
            }),
          });
        },
      }),
    );

  const handleRecalculate = () => {
    recalculateRanking({
      gigId,
      workspaceId: workspaceSlug,
    });
  };

  const handleAccept = (responseId: string) => {
    // TODO: Implement accept logic
    console.log("Accept:", responseId);
  };

  const handleReject = (responseId: string) => {
    // TODO: Implement reject logic
    console.log("Reject:", responseId);
  };

  const handleMessage = (responseId: string) => {
    router.push(
      `/orgs/${orgSlug}/workspaces/${workspaceSlug}/chat/${responseId}`,
    );
  };

  const candidates = rankingData?.candidates ?? [];
  const totalCount = rankingData?.totalCount ?? 0;
  const hasNextPage = (page + 1) * limit < totalCount;
  const hasPrevPage = page > 0;

  return (
    <div className="container mx-auto max-w-[1600px] w-full py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}`}
            >
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Назад к заданию
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Рейтинг кандидатов
          </h1>
          <p className="text-sm text-muted-foreground">
            Интеллектуальное ранжирование на основе AI-анализа
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            variant="outline"
            size="sm"
            className="gap-2 min-h-[44px] sm:min-h-[36px] touch-action-manipulation"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRecalculating ? "animate-spin" : ""}`}
            />
            {isRecalculating ? "Пересчет…" : "Пересчитать рейтинг"}
          </Button>

          {candidates.length >= 2 && (
            <Button
              onClick={() => setShowComparison(!showComparison)}
              variant={showComparison ? "default" : "outline"}
              size="sm"
              className="gap-2 min-h-[44px] sm:min-h-[36px] touch-action-manipulation"
            >
              <Users className="h-4 w-4" />
              {showComparison ? "Скрыть сравнение" : "Сравнить"}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Card */}
      {!isLoading && rankingData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Статистика</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Всего кандидатов
                </p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Настоятельно рекомендованы
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {
                    candidates.filter(
                      (
                        c: GigRankedCandidate,
                      ) => c.screening?.recommendation === "HIGHLY_RECOMMENDED",
                    ).length
                  }
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Рекомендованы</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {
                    candidates.filter(
                      (
                        c: GigRankedCandidate,
                      ) => c.screening?.recommendation === "RECOMMENDED",
                    ).length
                  }
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Средняя оценка</p>
                <p className="text-2xl font-bold">
                  {candidates.length > 0
                    ? Math.round(
                        candidates.reduce(
                          (
                            sum: number,
                            c: GigRankedCandidate,
                          ) => sum + (c.screening?.overallScore ?? 0),
                          0,
                        ) / candidates.length,
                      )
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="recommendation-filter"
                className="text-sm font-medium"
              >
                Рекомендация
              </label>
              <Select
                value={selectedRecommendation}
                onValueChange={(value) => {
                  setSelectedRecommendation(value);
                  setPage(0);
                }}
              >
                <SelectTrigger
                  id="recommendation-filter"
                  className="min-h-[44px] sm:min-h-[36px]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECOMMENDATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="score-filter" className="text-sm font-medium">
                Минимальная оценка
              </label>
              <Select
                value={selectedMinScore}
                onValueChange={(value) => {
                  setSelectedMinScore(value);
                  setPage(0);
                }}
              >
                <SelectTrigger
                  id="score-filter"
                  className="min-h-[44px] sm:min-h-[36px]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MIN_SCORE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(selectedRecommendation !== "all" || selectedMinScore !== "0") && (
            <div className="flex items-center gap-2 mt-4">
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Фильтры активны
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedRecommendation("all");
                  setSelectedMinScore("0");
                  setPage(0);
                }}
              >
                Сбросить
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison View */}
      {showComparison && candidates.length >= 2 && (
        <CandidateComparison
          candidates={candidates.slice(0, 3)}
          onClose={() => setShowComparison(false)}
        />
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка загрузки</AlertTitle>
          <AlertDescription>
            Не удалось загрузить рейтинг кандидатов. Попробуйте обновить
            страницу.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      )}

      {/* Ranking List */}
      {!isLoading && !error && (
        <>
          <RankingList
            candidates={candidates}
            orgSlug={orgSlug}
            workspaceSlug={workspaceSlug}
            gigId={gigId}
            onAccept={handleAccept}
            onReject={handleReject}
            onMessage={handleMessage}
          />

          {/* Pagination */}
          {totalCount > limit && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Показано {page * limit + 1}–
                    {Math.min((page + 1) * limit, totalCount)} из {totalCount}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={!hasPrevPage}
                      className="min-h-[44px] sm:min-h-[36px] touch-action-manipulation"
                    >
                      Назад
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={!hasNextPage}
                      className="min-h-[44px] sm:min-h-[36px] touch-action-manipulation"
                    >
                      Далее
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
