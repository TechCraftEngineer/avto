"use client";

import { Badge } from "@qbs-autonaim/ui/badge";
import { Button } from "@qbs-autonaim/ui/button";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { VacancyResponse } from "./types";

interface CandidateNavigationProps {
  currentResponse: VacancyResponse;
  allResponses: any[];
  onNavigate: (responseId: string) => void;
}

// Функция расчета соответствия (дублируется из header-card, потом можно вынести)
function calculateMatchScore(response: VacancyResponse): number {
  let score = 0;
  if (response.profileData && !response.profileData.error) score += 30;
  if (response.resumeId) score += 20;
  if (response.salaryExpectationsAmount) score += 15;
  if (response.email || response.phone || response.telegramUsername)
    score += 15;
  if (response.skills?.length) score += 10;
  if (response.coverLetter) score += 10;
  return Math.min(score, 100);
}

export function CandidateNavigation({
  currentResponse,
  allResponses,
  onNavigate,
}: CandidateNavigationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (allResponses.length > 0) {
      const index = allResponses.findIndex((r) => r.id === currentResponse.id);
      setCurrentIndex(index >= 0 ? index : 0);
    }
  }, [currentResponse.id, allResponses]);

  const handlePrevious = () => {
    const prevIndex = Math.max(0, currentIndex - 1);
    const prevResponse = allResponses[prevIndex];
    if (prevResponse && prevResponse.id !== currentResponse.id) {
      onNavigate(prevResponse.id);
      setCurrentIndex(prevIndex);
    }
  };

  const handleCardClick = (response: any, index: number) => {
    if (response && response.id !== currentResponse.id) {
      onNavigate(response.id);
      setCurrentIndex(index);
    }
  };

  const handleNext = () => {
    const nextIndex = Math.min(allResponses.length - 1, currentIndex + 1);
    const nextResponse = allResponses[nextIndex];
    if (nextResponse && nextResponse.id !== currentResponse.id) {
      onNavigate(nextResponse.id);
      setCurrentIndex(nextIndex);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-blue-100 text-blue-800";
      case "EVALUATED":
        return "bg-yellow-100 text-yellow-800";
      case "INTERVIEW":
        return "bg-purple-100 text-purple-800";
      case "NEGOTIATION":
        return "bg-orange-100 text-orange-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    return "text-gray-600";
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return "Менее часа назад";
    if (diffHours < 24) return `${diffHours} ч. назад`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} д. назад`;
  };

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex items-center justify-between p-4">
        {/* Навигация */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Предыдущий
          </Button>

          <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {currentIndex + 1} из {allResponses.length}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentIndex === allResponses.length - 1}
            className="gap-1"
          >
            Следующий
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Мини-карточки соседних кандидатов */}
        <div className="flex items-center gap-3">
          {/* Предыдущий кандидат */}
          {currentIndex > 0 && (
            <div
              className="flex items-center gap-2 p-2 rounded-lg border bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
              onClick={() =>
                handleCardClick(
                  allResponses[currentIndex - 1],
                  currentIndex - 1,
                )
              }
            >
              <div className="text-right">
                <p className="text-sm font-medium truncate max-w-32">
                  {allResponses[currentIndex - 1]?.candidateName || "Кандидат"}
                </p>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs ${getStatusColor(allResponses[currentIndex - 1]?.status || "NEW")}`}
                  >
                    {allResponses[currentIndex - 1]?.status || "NEW"}
                  </Badge>
                  <span
                    className={`text-xs font-bold ${getMatchScoreColor(calculateMatchScore(allResponses[currentIndex - 1]!))}`}
                  >
                    {calculateMatchScore(allResponses[currentIndex - 1]!)}%
                  </span>
                </div>
              </div>
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </div>
          )}

          {/* Следующий кандидат */}
          {currentIndex < allResponses.length - 1 && (
            <div
              className="flex items-center gap-2 p-2 rounded-lg border bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
              onClick={() =>
                handleCardClick(
                  allResponses[currentIndex + 1],
                  currentIndex + 1,
                )
              }
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium truncate max-w-32">
                  {allResponses[currentIndex + 1]?.candidateName || "Кандидат"}
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold ${getMatchScoreColor(calculateMatchScore(allResponses[currentIndex + 1]!))}`}
                  >
                    {calculateMatchScore(allResponses[currentIndex + 1]!)}%
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getStatusColor(allResponses[currentIndex + 1]?.status || "NEW")}`}
                  >
                    {allResponses[currentIndex + 1]?.status || "NEW"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Кнопка сортировки */}
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowUpDown className="h-4 w-4" />
          Сортировать
        </Button>
      </div>
    </div>
  );
}
