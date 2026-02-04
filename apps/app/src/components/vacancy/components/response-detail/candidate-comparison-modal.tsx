"use client";

import { Badge } from "@qbs-autonaim/ui/badge";
import { Button } from "@qbs-autonaim/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@qbs-autonaim/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@qbs-autonaim/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@qbs-autonaim/ui/tooltip";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Award,
  Clock,
  GitCompare,
  Star,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { VacancyResponse } from "./types";

interface CandidateComparisonModalProps {
  currentResponse: VacancyResponse;
  allResponses: VacancyResponse[]; // В будущем можно передавать все отклики
}

interface CandidateMetrics {
  id: string;
  name: string;
  matchScore: number;
  salary: number | null;
  experience: string;
  skills: string[];
  responseTime: string;
  status: string;
  lastActivity: string;
}

type SortField = "name" | "matchScore" | "salary" | "responseTime";
type SortDirection = "asc" | "desc";

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

function calculateResponseTime(response: VacancyResponse): string {
  const now = new Date();
  const respondedAt = response.respondedAt || response.createdAt;
  const diffMs = now.getTime() - new Date(respondedAt).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 24) return `${diffHours}ч`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}д`;
}

function calculateLastActivity(response: VacancyResponse): string {
  const respondedAt = response.respondedAt || response.createdAt;
  const now = new Date();
  const diffMs = now.getTime() - new Date(respondedAt).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Сегодня";
  if (diffDays === 1) return "Вчера";
  if (diffDays < 7) return `${diffDays} д.`;
  return ">7 д.";
}

function getExperienceFromProfile(response: VacancyResponse): string {
  if (response.profileData && !response.profileData.error) {
    const profile = response.profileData;
    if (profile.experience) {
      if (Array.isArray(profile.experience) && profile.experience.length > 0) {
        return `${profile.experience.length} позиций`;
      }
      return "Есть опыт";
    }
  }
  return "Не указано";
}

export function CandidateComparisonModal({
  currentResponse,
  allResponses,
}: CandidateComparisonModalProps) {
  const [sortField, setSortField] = useState<SortField>("matchScore");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Пока создаем mock данные для демонстрации
  // В будущем здесь будет запрос к API за всеми кандидатами вакансии
  const mockCandidates: CandidateMetrics[] = [
    {
      id: currentResponse.id,
      name: currentResponse.candidateName || "Текущий кандидат",
      matchScore: calculateMatchScore(currentResponse),
      salary: currentResponse.salaryExpectationsAmount,
      experience: getExperienceFromProfile(currentResponse),
      skills: currentResponse.skills || [],
      responseTime: calculateResponseTime(currentResponse),
      status: currentResponse.status,
      lastActivity: calculateLastActivity(currentResponse),
    },
    // Mock данные для сравнения
    {
      id: "mock-1",
      name: "Алексей Иванов",
      matchScore: 85,
      salary: 180000,
      experience: "5 позиций",
      skills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
      responseTime: "2ч",
      status: "EVALUATED",
      lastActivity: "Сегодня",
    },
    {
      id: "mock-2",
      name: "Мария Петрова",
      matchScore: 92,
      salary: 220000,
      experience: "7 позиций",
      skills: ["React", "Vue.js", "Python", "Django", "AWS"],
      responseTime: "1д",
      status: "INTERVIEW",
      lastActivity: "Вчера",
    },
    {
      id: "mock-3",
      name: "Дмитрий Сидоров",
      matchScore: 78,
      salary: 160000,
      experience: "3 позиции",
      skills: ["JavaScript", "HTML", "CSS", "MongoDB"],
      responseTime: "3д",
      status: "NEW",
      lastActivity: "3 д.",
    },
  ];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedAndFilteredCandidates = useMemo(() => {
    let filtered = mockCandidates;

    if (statusFilter) {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    return [...filtered].sort((a, b) => {
      let aValue: number | string = 0;
      let bValue: number | string = 0;

      switch (sortField) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "matchScore":
          aValue = a.matchScore;
          bValue = b.matchScore;
          break;
        case "salary":
          aValue = a.salary ?? 0;
          bValue = b.salary ?? 0;
          break;
        case "responseTime":
          aValue = a.responseTime;
          bValue = b.responseTime;
          break;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
  }, [mockCandidates, sortField, sortDirection, statusFilter]);

  const uniqueStatuses = Array.from(
    new Set(mockCandidates.map((c) => c.status)),
  );

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    );
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
    if (score >= 90) return "text-green-600 font-bold";
    if (score >= 70) return "text-blue-600 font-semibold";
    if (score >= 50) return "text-yellow-600 font-medium";
    return "text-red-600 font-medium";
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <GitCompare className="h-4 w-4" />
          Сравнить кандидатов
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <GitCompare className="h-6 w-6" />
              Сравнение кандидатов
            </DialogTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Всего: {sortedAndFilteredCandidates.length}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Фильтры */}
        <div className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Статус:</span>
            <Button
              variant={statusFilter === null ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(null)}
            >
              Все
            </Button>
            {uniqueStatuses.map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Таблица */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-56">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 font-semibold"
                    onClick={() => handleSort("name")}
                  >
                    Кандидат
                    <SortIcon field="name" />
                  </Button>
                </TableHead>
                <TableHead className="text-center w-32">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 font-semibold mx-auto"
                    onClick={() => handleSort("matchScore")}
                  >
                    <Award className="h-4 w-4" />
                    Соответствие
                    <SortIcon field="matchScore" />
                  </Button>
                </TableHead>
                <TableHead className="text-center w-40">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 font-semibold mx-auto"
                    onClick={() => handleSort("salary")}
                  >
                    <Star className="h-4 w-4" />
                    Зарплата
                    <SortIcon field="salary" />
                  </Button>
                </TableHead>
                <TableHead className="text-center w-32">
                  <div className="flex items-center justify-center gap-1 font-semibold">
                    Опыт
                  </div>
                </TableHead>
                <TableHead className="text-center w-28">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 font-semibold mx-auto"
                    onClick={() => handleSort("responseTime")}
                  >
                    <Clock className="h-4 w-4" />
                    Отклик
                    <SortIcon field="responseTime" />
                  </Button>
                </TableHead>
                <TableHead className="text-center w-32">
                  <div className="flex items-center justify-center gap-1 font-semibold">
                    <Activity className="h-4 w-4" />
                    Активность
                  </div>
                </TableHead>
                <TableHead className="text-center w-36">
                  <div className="flex items-center justify-center gap-1 font-semibold">
                    Статус
                  </div>
                </TableHead>
                <TableHead className="min-w-64">
                  <div className="font-semibold">Навыки</div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredCandidates.map((candidate) => (
                <TableRow
                  key={candidate.id}
                  className={
                    candidate.id === currentResponse.id
                      ? "bg-blue-50/50 border-l-4 border-l-blue-500 hover:bg-blue-50/70"
                      : "hover:bg-muted/50"
                  }
                >
                  <TableCell className="font-medium py-6">
                    <div className="flex items-center gap-3">
                      {candidate.id === currentResponse.id && (
                        <Star className="h-5 w-5 text-blue-600 fill-blue-600 flex-shrink-0" />
                      )}
                      <span className="text-base">{candidate.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-6">
                    <div className="flex items-center justify-center">
                      <span
                        className={`text-2xl font-bold ${getMatchScoreColor(candidate.matchScore)}`}
                      >
                        {candidate.matchScore}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono py-6">
                    <span className="text-base">
                      {candidate.salary
                        ? `${candidate.salary.toLocaleString()} ₽`
                        : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center py-6">
                    <span className="text-base">{candidate.experience}</span>
                  </TableCell>
                  <TableCell className="text-center py-6">
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      {candidate.responseTime}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-6">
                    <span className="text-base">{candidate.lastActivity}</span>
                  </TableCell>
                  <TableCell className="text-center py-6">
                    <Badge
                      variant="outline"
                      className={`${getStatusColor(candidate.status)} text-sm px-3 py-1`}
                    >
                      {candidate.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-6">
                    <TooltipProvider>
                      <div className="flex flex-wrap gap-2">
                        {candidate.skills.slice(0, 4).map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="text-sm px-3 py-1"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {candidate.skills.length > 4 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="outline"
                                className="text-sm px-3 py-1 cursor-help"
                              >
                                +{candidate.skills.length - 4}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="flex flex-wrap gap-1">
                                {candidate.skills.slice(4).map((skill) => (
                                  <Badge
                                    key={skill}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Подсказка */}
        <div className="px-6 py-4 border-t bg-muted/30">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Подсказка</p>
              <p className="text-sm text-muted-foreground">
                Нажмите на заголовки колонок для сортировки. Текущий кандидат
                выделен синей полосой и звездочкой. Используйте фильтры по
                статусу для быстрого поиска нужных кандидатов.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
