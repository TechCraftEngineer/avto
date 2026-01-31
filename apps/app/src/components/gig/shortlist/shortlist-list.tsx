"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import { Badge, Progress, Separator } from "@qbs-autonaim/ui";
import { Award, BarChart3, Trophy, Users } from "lucide-react";
import { ShortlistCandidateCard } from "./shortlist-candidate-card";

type ShortlistCandidate =
  RouterOutputs["gig"]["shortlist"]["candidates"][number];

interface ShortlistListProps {
  candidates: ShortlistCandidate[];
  orgSlug: string;
  workspaceSlug: string;
  gigId: string;
  isLoading?: boolean;
}

export function ShortlistList({
  candidates,
  orgSlug,
  workspaceSlug,
  gigId,
  isLoading = false,
}: ShortlistListProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-48 rounded-lg border bg-muted/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!isLoading && candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-6">
          <Award className="h-8 w-8 text-muted-foreground/60" />
        </div>
        <div className="space-y-3 max-w-md">
          <h3 className="text-lg font-semibold tracking-tight">
            Шортлист пока пуст
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Нет кандидатов, соответствующих текущим критериям фильтрации.
            Попробуйте изменить настройки или дождаться новых откликов.
          </p>
        </div>
        <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>0 кандидатов</span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Ожидание откликов</span>
          </div>
        </div>
      </div>
    );
  }

  // Разделяем кандидатов на топ-3 и остальных для визуального выделения
  const topThree = candidates.slice(0, 3);
  const others = candidates.slice(3);

  return (
    <div className="space-y-8">
      {/* Progress Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Всего кандидатов</span>
            <Badge variant="secondary" className="text-xs">
              {candidates.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Оценено</span>
          </div>
        </div>
        <Progress
          value={(candidates.length / Math.max(candidates.length, 10)) * 100}
          className="h-2"
        />
      </div>

      <Separator />

      {/* Top 3 Candidates Section */}
      {topThree.length > 0 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Trophy className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Топ-кандидаты
                </h2>
                <p className="text-sm text-muted-foreground">
                  Наиболее подходящие по оценкам AI
                </p>
              </div>
            </div>
            <Badge variant="default" className="gap-1">
              <span className="text-xs font-medium">{topThree.length}</span>
            </Badge>
          </div>

          <div className="grid gap-6">
            {topThree.map((candidate, index) => (
              <div
                key={candidate.responseId}
                className="group transform transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ShortlistCandidateCard
                  candidate={candidate}
                  orgSlug={orgSlug}
                  workspaceSlug={workspaceSlug}
                  gigId={gigId}
                  rank={index + 1}
                  isTopCandidate={true}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Separator between sections */}
      {topThree.length > 0 && others.length > 0 && (
        <div className="relative">
          <Separator />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-background px-3">
              <div className="h-px w-8 bg-border" />
            </div>
          </div>
        </div>
      )}

      {/* Other Candidates Section */}
      {others.length > 0 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <Award className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Другие кандидаты
                </h2>
                <p className="text-sm text-muted-foreground">
                  Дополнительные варианты для рассмотрения
                </p>
              </div>
            </div>
            <Badge variant="outline" className="gap-1">
              <span className="text-xs font-medium">{others.length}</span>
            </Badge>
          </div>

          <div className="grid gap-6">
            {others.map((candidate, index) => (
              <div
                key={candidate.responseId}
                className="group transform transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-md animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <ShortlistCandidateCard
                  candidate={candidate}
                  orgSlug={orgSlug}
                  workspaceSlug={workspaceSlug}
                  gigId={gigId}
                  rank={index + 4} // Начинаем с 4-го места
                  isTopCandidate={false}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
