"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  getRecommendationLabel,
  ShortlistError,
  ShortlistFilters,
  ShortlistHeader,
  ShortlistList,
  ShortlistLoading,
  ShortlistStats,
} from "~/components/gig";
import { useWorkspace } from "~/hooks/use-workspace";
import { useORPC } from "~/orpc/react";

interface ShortlistPageClientProps {
  orgSlug: string;
  workspaceSlug: string;
  gigId: string;
}

export function ShortlistPageClient({
  orgSlug,
  workspaceSlug,
  gigId,
}: ShortlistPageClientProps) {
  const _router = useRouter();
  const orpc = useORPC();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();
  const [selectedMinScore, setSelectedMinScore] = useState<string>("70");
  const [includeOnlyHighlyRecommended, setIncludeOnlyHighlyRecommended] =
    useState<boolean>(false);
  const [prioritizeBudgetFit, setPrioritizeBudgetFit] =
    useState<boolean>(false);

  // Fetch shortlist candidates
  const {
    data: shortlistData,
    isLoading,
    error,
  } = useQuery({
    ...orpc.gig.shortlist.queryOptions({
      input: {
        gigId,
        workspaceId: workspace?.id ?? "",
        minScore: Number.parseInt(selectedMinScore, 10),
        maxCandidates: 20, // Fixed limit for shortlist
        includeOnlyHighlyRecommended,
        prioritizeBudgetFit,
      },
    }),
    enabled: !!workspace?.id,
  });

  // Recalculate shortlist mutation
  const { mutate: recalculateShortlist, isPending: isRecalculating } =
    useMutation(
      orpc.gig.recalculateShortlist.mutationOptions({
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: orpc.gig.shortlist.queryKey({
              input: {
                gigId,
                workspaceId: workspace?.id ?? "",
                minScore: Number.parseInt(selectedMinScore, 10),
                maxCandidates: 20,
                includeOnlyHighlyRecommended,
                prioritizeBudgetFit,
              },
            }),
          });
          toast.success("Шортлист пересчитан");
        },
        onError: () => {
          toast.error("Ошибка пересчета шортлиста");
        },
      }),
    );

  const handleRecalculate = () => {
    if (!workspace?.id) return;
    recalculateShortlist({
      gigId,
      workspaceId: workspace.id,
    });
  };

  const handleExportCSV = () => {
    if (!shortlistData?.candidates.length) {
      toast.error("Нет данных для экспорта");
      return;
    }

    try {
      const headers = [
        "Место",
        "Имя",
        "Общая оценка",
        "Оценка цены",
        "Оценка сроков",
        "Оценка навыков",
        "Оценка опыта",
        "Рекомендация",
        "Предложенная цена",
        "Сроки выполнения",
        "Email",
        "Телефон",
        "Telegram",
        "Ключевые преимущества",
        "Недостатки",
      ];

      const rows = shortlistData.candidates.map((candidate, index) => [
        String(index + 1),
        candidate.name,
        String(candidate.compositeScore),
        candidate.priceScore ? String(candidate.priceScore) : "—",
        candidate.deliveryScore ? String(candidate.deliveryScore) : "—",
        candidate.skillsMatchScore ? String(candidate.skillsMatchScore) : "—",
        candidate.experienceScore ? String(candidate.experienceScore) : "—",
        getRecommendationLabel(candidate.recommendation),
        candidate.proposedPrice ? String(candidate.proposedPrice) : "—",
        candidate.proposedDeliveryDays
          ? String(candidate.proposedDeliveryDays)
          : "—",
        candidate.contactInfo.email || "—",
        candidate.contactInfo.phone || "—",
        candidate.contactInfo.telegram || "—",
        candidate.strengths.join("; "),
        candidate.weaknesses.join("; "),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","),
        ),
      ].join("\n");

      const blob = new Blob([`\uFEFF${csvContent}`], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gig-shortlist-${gigId}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Шортлист экспортирован");
    } catch {
      toast.error("Ошибка экспорта");
    }
  };

  const handleFiltersReset = () => {
    setSelectedMinScore("70");
    setIncludeOnlyHighlyRecommended(false);
    setPrioritizeBudgetFit(false);
  };

  const candidates = shortlistData?.candidates ?? [];
  const totalCandidates = shortlistData?.totalCandidates ?? 0;

  const highlyRecommendedCount = candidates.filter(
    (c) => c.recommendation === "HIGHLY_RECOMMENDED",
  ).length;

  const averageScore =
    candidates.length > 0
      ? Math.round(
          candidates.reduce((sum, c) => sum + c.compositeScore, 0) /
            candidates.length,
        )
      : 0;

  return (
    <div className="container mx-auto max-w-[1600px] w-full py-6 space-y-6">
      {/* Header */}
      <ShortlistHeader
        orgSlug={orgSlug}
        workspaceSlug={workspaceSlug}
        gigId={gigId}
        onRecalculate={handleRecalculate}
        onExportCSV={handleExportCSV}
        isRecalculating={isRecalculating}
        hasCandidates={candidates.length > 0}
      />

      {/* Stats Card */}
      {!isLoading && shortlistData && (
        <ShortlistStats
          candidatesCount={candidates.length}
          totalCandidates={totalCandidates}
          highlyRecommendedCount={highlyRecommendedCount}
          averageScore={averageScore}
        />
      )}

      {/* Filters */}
      <ShortlistFilters
        selectedMinScore={selectedMinScore}
        includeOnlyHighlyRecommended={includeOnlyHighlyRecommended}
        prioritizeBudgetFit={prioritizeBudgetFit}
        onMinScoreChange={setSelectedMinScore}
        onHighlyRecommendedChange={setIncludeOnlyHighlyRecommended}
        onBudgetFitChange={setPrioritizeBudgetFit}
        onReset={handleFiltersReset}
      />

      {/* Error State */}
      {error && <ShortlistError />}

      {/* Loading State */}
      {isLoading && <ShortlistLoading />}

      {/* Shortlist List */}
      {!isLoading && !error && (
        <ShortlistList
          candidates={candidates}
          orgSlug={orgSlug}
          workspaceSlug={workspaceSlug}
          gigId={gigId}
        />
      )}
    </div>
  );
}
