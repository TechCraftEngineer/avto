"use client";

import { Badge } from "@qbs-autonaim/ui/badge";
import { Button } from "@qbs-autonaim/ui/button";
import { ArrowUpDown, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import type { VacancyResponse, VacancyResponseFromList } from "./types";

interface CandidateNavigationProps {
  currentResponse: VacancyResponse;
  allResponses: VacancyResponse[] | VacancyResponseFromList[];
  onNavigate: (responseId: string) => void;
}

// Функция расчета соответствия (дублируется из header-card, потом можно вынести)
function calculateMatchScore(
  response: VacancyResponse | VacancyResponseFromList,
): number {
  let score = 0;
  if (
    "profileData" in response &&
    response.profileData &&
    !response.profileData.error
  )
    score += 30;
  if ("resumeId" in response && response.resumeId) score += 20;
  if (
    "salaryExpectationsAmount" in response &&
    response.salaryExpectationsAmount
  )
    score += 15;
  const hasContact =
    ("email" in response && response.email) ||
    ("phone" in response && response.phone) ||
    ("telegramUsername" in response && response.telegramUsername);
  if (hasContact) score += 15;
  if ("skills" in response && response.skills?.length) score += 10;
  if ("coverLetter" in response && response.coverLetter) score += 10;
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

  const handleCardClick = (
    response: VacancyResponse | VacancyResponseFromList,
    index: number,
  ) => {
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

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b">
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
          {currentIndex > 0 &&
            (() => {
              const prevResponse = allResponses[currentIndex - 1];
              if (!prevResponse) return null;

              return (
                <button
                  type="button"
                  className="flex items-center gap-2 p-2 rounded-lg border bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                  onClick={() =>
                    handleCardClick(prevResponse, currentIndex - 1)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCardClick(prevResponse, currentIndex - 1);
                    }
                  }}
                >
                  <div className="text-right">
                    <p className="text-sm font-medium truncate max-w-32">
                      {prevResponse.candidateName || "Кандидат"}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusColor(prevResponse.status || "NEW")}`}
                      >
                        {prevResponse.status || "NEW"}
                      </Badge>
                      <span
                        className={`text-xs font-bold ${getMatchScoreColor(calculateMatchScore(prevResponse))}`}
                      >
                        {calculateMatchScore(prevResponse)}%
                      </span>
                    </div>
                  </div>
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            })()}

          {/* Следующий кандидат */}
          {currentIndex < allResponses.length - 1 &&
            (() => {
              const nextResponse = allResponses[currentIndex + 1];
              if (!nextResponse) return null;

              return (
                <button
                  type="button"
                  className="flex items-center gap-2 p-2 rounded-lg border bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                  onClick={() =>
                    handleCardClick(nextResponse, currentIndex + 1)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCardClick(nextResponse, currentIndex + 1);
                    }
                  }}
                >
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium truncate max-w-32">
                      {nextResponse.candidateName || "Кандидат"}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold ${getMatchScoreColor(calculateMatchScore(nextResponse))}`}
                      >
                        {calculateMatchScore(nextResponse)}%
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusColor(nextResponse.status || "NEW")}`}
                      >
                        {nextResponse.status || "NEW"}
                      </Badge>
                    </div>
                  </div>
                </button>
              );
            })()}
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
