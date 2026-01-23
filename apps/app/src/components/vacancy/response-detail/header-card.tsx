"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@qbs-autonaim/ui";
import {
  Briefcase,
  Calendar,
  ChevronDown,
  ChevronUp,
  DollarSign,
  FileText,
  MessageSquare,
  User,
} from "lucide-react";
import { useState } from "react";
import type { VacancyResponse } from "./types";

interface VacancyResponseHeaderCardProps {
  response: VacancyResponse;
  onAccept?: () => void;
  onReject?: () => void;
  onMessage?: () => void;
  onEvaluate?: () => void;
  isProcessing?: boolean;
  isPolling?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "NEW":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "EVALUATED":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "INTERVIEW":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "NEGOTIATION":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "COMPLETED":
      return "bg-green-100 text-green-800 border-green-200";
    case "SKIPPED":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "NEW":
      return "Новый";
    case "EVALUATED":
      return "Оценено";
    case "INTERVIEW":
      return "Собеседование";
    case "NEGOTIATION":
      return "Переговоры";
    case "COMPLETED":
      return "Завершено";
    case "SKIPPED":
      return "Пропущено";
    default:
      return status;
  }
};

export function VacancyResponseHeaderCard({
  response,
  onAccept,
  onReject,
  onMessage,
  onEvaluate,
  isProcessing,
  isPolling,
}: VacancyResponseHeaderCardProps) {
  const [isExperienceExpanded, setIsExperienceExpanded] = useState(false);
  const [isSalaryCommentExpanded, setIsSalaryCommentExpanded] = useState(false);

  // Ограничение длины текста для превью
  const EXPERIENCE_PREVIEW_LENGTH = 150;
  const SALARY_COMMENT_PREVIEW_LENGTH = 100;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          {/* Candidate Info */}
          <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
              <User className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg sm:text-xl truncate">
                {response.candidateName || "Кандидат"}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge
                  variant="outline"
                  className={getStatusColor(response.status)}
                >
                  {getStatusLabel(response.status)}
                </Badge>
                {response.resumeId && (
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Есть резюме
                  </Badge>
                )}
                {response.salaryExpectationsAmount && (
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 border-emerald-200"
                  >
                    <DollarSign className="h-3 w-3 mr-1" />
                    {response.salaryExpectationsAmount.toLocaleString()} ₽
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Откликнулся{" "}
                {new Date(
                  response.respondedAt || response.createdAt,
                ).toLocaleDateString("ru-RU")}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            {onMessage && (
              <Button
                variant="outline"
                size="sm"
                onClick={onMessage}
                disabled={isProcessing}
                className="min-h-[36px]"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Сообщение
              </Button>
            )}
            {onEvaluate && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEvaluate}
                disabled={isProcessing || isPolling}
                className="min-h-[36px]"
              >
                {isPolling ? (
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Briefcase className="h-4 w-4 mr-2" />
                )}
                Оценить
              </Button>
            )}
            <div className="flex gap-2">
              {onReject && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReject}
                  disabled={isProcessing}
                  className="min-h-[36px] text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Отклонить
                </Button>
              )}
              {onAccept && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onAccept}
                  disabled={isProcessing}
                  className="min-h-[36px]"
                >
                  Принять
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Key Info Summary */}
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {response.salaryExpectationsAmount && (
            <div className="flex items-start gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <DollarSign className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-emerald-800">
                  Зарплатные ожидания
                </div>
                <div className="text-lg font-semibold text-emerald-900">
                  {response.salaryExpectationsAmount.toLocaleString()} ₽
                </div>
                {response.salaryExpectationsComment && (
                  <div className="text-xs text-emerald-700 mt-1">
                    {response.salaryExpectationsComment.length >
                    SALARY_COMMENT_PREVIEW_LENGTH ? (
                      <>
                        {isSalaryCommentExpanded ? (
                          <>
                            {response.salaryExpectationsComment}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsSalaryCommentExpanded(false)}
                              className="h-5 px-1.5 py-0 mt-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100"
                            >
                              <ChevronUp className="h-2.5 w-2.5 mr-1" />
                              Свернуть
                            </Button>
                          </>
                        ) : (
                          <>
                            {response.salaryExpectationsComment.slice(
                              0,
                              SALARY_COMMENT_PREVIEW_LENGTH,
                            )}
                            ...
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsSalaryCommentExpanded(true)}
                              className="h-5 px-1.5 py-0 mt-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100"
                            >
                              <ChevronDown className="h-2.5 w-2.5 mr-1" />
                              Ещё
                            </Button>
                          </>
                        )}
                      </>
                    ) : (
                      response.salaryExpectationsComment
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {response.resumeId && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <FileText className="h-5 w-5 text-blue-600 shrink-0" />
              <div>
                <div className="text-sm font-medium text-blue-800">Резюме</div>
                <div className="text-sm text-blue-700">
                  Доступно для просмотра
                </div>
              </div>
            </div>
          )}

          {response.experience && (
            <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <Briefcase className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-purple-800">
                  Опыт работы
                </div>
                <div className="text-sm text-purple-700 mt-1">
                  {response.experience.length > EXPERIENCE_PREVIEW_LENGTH ? (
                    <>
                      {isExperienceExpanded ? (
                        <>
                          {response.experience}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExperienceExpanded(false)}
                            className="h-6 px-2 py-0 mt-2 text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                          >
                            <ChevronUp className="h-3 w-3 mr-1" />
                            Свернуть
                          </Button>
                        </>
                      ) : (
                        <>
                          {response.experience.slice(
                            0,
                            EXPERIENCE_PREVIEW_LENGTH,
                          )}
                          ...
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExperienceExpanded(true)}
                            className="h-6 px-2 py-0 mt-2 text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                          >
                            <ChevronDown className="h-3 w-3 mr-1" />
                            Показать больше
                          </Button>
                        </>
                      )}
                    </>
                  ) : (
                    response.experience
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
