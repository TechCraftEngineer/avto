"use client";

import { Badge } from "@qbs-autonaim/ui";
import {
  CheckCircle2,
  Star,
  TrendingDown,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";
import type { GigResponse, GigContextData } from "./types";

interface SummaryCardProps {
  response: GigResponse;
  gig?: GigContextData;
}

export function ResponseSummaryCard({ response, gig }: SummaryCardProps) {
  const screening = response.screening;

  // Calculate skills match
  const candidateSkills = response.skills || [];
  const requiredSkills = gig?.requiredSkills || [];
  const matchedSkills = requiredSkills.filter((s) =>
    candidateSkills.some((cs) => cs.toLowerCase() === s.toLowerCase()),
  );
  const skillsMatchPercent =
    requiredSkills.length > 0
      ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
      : null;

  // Price comparison
  const price = response.proposedPrice;
  const priceStatus =
    price && gig && gig.budgetMin && gig.budgetMax
      ? (() => {
          const avgBudget = (gig.budgetMin + gig.budgetMax) / 2;
          const diff = ((price - avgBudget) / avgBudget) * 100;
          if (Math.abs(diff) < 10)
            return {
              label: "В рынке",
              color: "text-green-600",
              icon: CheckCircle2,
            };
          if (diff < 0)
            return {
              label: `Дешевле на ${Math.abs(Math.round(diff))}%`,
              color: "text-green-600",
              icon: TrendingDown,
            };
          return {
            label: `Дороже на ${Math.round(diff)}%`,
            color: "text-orange-600",
            icon: TrendingUp,
          };
        })()
      : null;

  // Delivery comparison
  // Parse estimatedDuration to number (e.g., "1-2 дня" -> 2, "неделя" -> 7)
  const parseDurationToDays = (duration: string | null): number => {
    if (!duration) return 7;
    const match = duration.match(/(\d+)/);
    if (match?.[1]) return parseInt(match[1], 10);
    if (duration.toLowerCase().includes("недел")) return 7;
    if (
      duration.toLowerCase().includes("день") ||
      duration.toLowerCase().includes("дней")
    )
      return 1;
    if (duration.toLowerCase().includes("месяц")) return 30;
    return 7;
  };

  const gigTimelineDays = gig ? parseDurationToDays(gig.estimatedDuration) : 7;
  const delivery = response.proposedDeliveryDays;
  const deliveryStatus =
    delivery && gig
      ? (() => {
          const diff = delivery - gigTimelineDays;
          if (diff <= 0)
            return {
              label: `Быстрее на ${Math.abs(diff)} дн.`,
              color: "text-green-600",
              icon: TrendingDown,
            };
          if (diff <= 1)
            return {
              label: "Стандартные сроки",
              color: "text-green-600",
              icon: CheckCircle2,
            };
          return {
            label: `Медленнее на ${diff} дн.`,
            color: "text-orange-600",
            icon: TrendingUp,
          };
        })()
      : null;

  // Overall score status
  const overallScore = screening?.overallScore;
  const scoreStatus = overallScore
    ? (() => {
        if (overallScore >= 80)
          return {
            label: "Отличное совпадение",
            color: "text-green-600",
            variant: "default" as const,
          };
        if (overallScore >= 60)
          return {
            label: "Хорошее совпадение",
            color: "text-blue-600",
            variant: "secondary" as const,
          };
        if (overallScore >= 40)
          return {
            label: "Среднее совпадение",
            color: "text-yellow-600",
            variant: "outline" as const,
          };
        return {
          label: "Слабое совпадение",
          color: "text-red-600",
          variant: "outline" as const,
        };
      })()
    : null;

  // Show only if there's meaningful data
  const hasData =
    skillsMatchPercent !== null ||
    priceStatus ||
    deliveryStatus ||
    overallScore;
  if (!hasData) return null;

  return (
    <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Итоговая оценка</h3>
        {scoreStatus && (
          <Badge variant={scoreStatus.variant} className="ml-auto">
            {overallScore}/100
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
        {/* Skills Match */}
        {skillsMatchPercent !== null && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-background/50">
            {skillsMatchPercent >= 70 ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            ) : skillsMatchPercent >= 40 ? (
              <Star className="h-4 w-4 text-yellow-600 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <div className="min-w-0">
              <div className="text-muted-foreground text-xs">Навыки</div>
              <div className="font-medium truncate">
                {skillsMatchPercent}% ({matchedSkills.length}/
                {requiredSkills.length})
              </div>
            </div>
          </div>
        )}

        {/* Price */}
        {priceStatus && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-background/50">
            <priceStatus.icon
              className={`h-4 w-4 shrink-0 ${priceStatus.color}`}
            />
            <div className="min-w-0">
              <div className="text-muted-foreground text-xs">Цена</div>
              <div className="font-medium truncate">{priceStatus.label}</div>
            </div>
          </div>
        )}

        {/* Delivery */}
        {deliveryStatus && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-background/50">
            <deliveryStatus.icon
              className={`h-4 w-4 shrink-0 ${deliveryStatus.color}`}
            />
            <div className="min-w-0">
              <div className="text-muted-foreground text-xs">Сроки</div>
              <div className="font-medium truncate">{deliveryStatus.label}</div>
            </div>
          </div>
        )}

        {/* Score breakdown */}
        {overallScore && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-background/50 sm:col-span-2 lg:col-span-3">
            <Wallet className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-muted-foreground text-xs">
                Детализация оценки
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                {screening?.priceScore !== undefined &&
                  screening.priceScore !== null && (
                    <Badge variant="outline" className="text-xs">
                      Цена: {screening.priceScore}/100
                    </Badge>
                  )}
                {screening?.skillsMatchScore !== undefined &&
                  screening.skillsMatchScore !== null && (
                    <Badge variant="outline" className="text-xs">
                      Навыки: {screening.skillsMatchScore}/100
                    </Badge>
                  )}
                {screening?.experienceScore !== undefined &&
                  screening.experienceScore !== null && (
                    <Badge variant="outline" className="text-xs">
                      Опыт: {screening.experienceScore}/100
                    </Badge>
                  )}
                {screening?.deliveryScore !== undefined &&
                  screening.deliveryScore !== null && (
                    <Badge variant="outline" className="text-xs">
                      Сроки: {screening.deliveryScore}/100
                    </Badge>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
