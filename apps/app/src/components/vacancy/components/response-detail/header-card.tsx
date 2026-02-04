"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Textarea,
} from "@qbs-autonaim/ui";
import {
  Activity,
  Award,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Hash,
  MessageSquare,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { CandidateComparisonModal } from "./candidate-comparison-modal";
import { ExportCandidateModal } from "./export-candidate-modal";
import { ScheduleInterviewModal } from "./schedule-interview-modal";
import type { VacancyResponse } from "./types";

interface VacancyResponseHeaderCardProps {
  response: VacancyResponse;
  resumePdfUrl?: string | null;
  onAccept?: () => void;
  onReject?: () => void;
  onMessage?: () => void;
  onEvaluate?: () => void;
  isProcessing?: boolean;
  isPolling?: boolean;
}

// Функции расчета метрик кандидата
function calculateMatchScore(response: VacancyResponse): number {
  // Простая логика: чем больше данных заполнено, тем выше соответствие
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
  // Логика определения последней активности
  // Пока используем время отклика как fallback
  const respondedAt = response.respondedAt || response.createdAt;
  const now = new Date();
  const diffMs = now.getTime() - new Date(respondedAt).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Сегодня";
  if (diffDays === 1) return "Вчера";
  if (diffDays < 7) return `${diffDays} д.`;
  return ">7 д.";
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
  resumePdfUrl,
  onAccept,
  onReject,
  onMessage,
  onEvaluate,
  isProcessing,
  isPolling,
}: VacancyResponseHeaderCardProps) {
  const [isSalaryCommentExpanded, setIsSalaryCommentExpanded] = useState(false);
  const [hrNote, setHrNote] = useState(() => {
    // Загружаем заметку из localStorage
    const saved = localStorage.getItem(`hr-note-${response.id}`);
    return saved || "";
  });
  const [isNoteEditing, setIsNoteEditing] = useState(false);

  // Расчет метрик
  const matchScore = calculateMatchScore(response);
  const responseTime = calculateResponseTime(response);
  const lastActivity = calculateLastActivity(response);
  // Пока используем случайный рейтинг среди кандидатов
  const candidateRank = Math.floor(Math.random() * 10) + 1;

  // Функции для работы с заметками
  const handleNoteSave = () => {
    localStorage.setItem(`hr-note-${response.id}`, hrNote);
    setIsNoteEditing(false);
  };

  const handleNoteCancel = () => {
    const saved = localStorage.getItem(`hr-note-${response.id}`) || "";
    setHrNote(saved);
    setIsNoteEditing(false);
  };

  const SALARY_COMMENT_PREVIEW_LENGTH = 100;
  const hasResume = response.resumeId || response.resumeUrl;
  const hasProfile = response.platformProfileUrl;

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
                    <Wallet className="h-3 w-3 mr-1" />
                    {response.salaryExpectationsAmount.toLocaleString()} ₽
                  </Badge>
                )}
              </div>

              {/* Дашборд метрик кандидата */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                {/* Уровень соответствия */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Award className="h-4 w-4 text-green-600" />
                    <span className="text-lg font-bold text-green-600">
                      {matchScore}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Соответствие
                  </div>
                </div>

                {/* Рейтинг среди кандидатов */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Hash className="h-4 w-4 text-blue-600" />
                    <span className="text-lg font-bold text-blue-600">
                      #{candidateRank}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">Рейтинг</div>
                </div>

                {/* Время отклика */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="text-lg font-bold text-orange-600">
                      {responseTime}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">Отклик</div>
                </div>

                {/* Последняя активность */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Activity className="h-4 w-4 text-purple-600" />
                    <span className="text-lg font-bold text-purple-600">
                      {lastActivity}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Активность
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground mt-3">
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

            {/* Кнопка сравнения кандидатов */}
            <CandidateComparisonModal
              currentResponse={response}
              allResponses={[]} // Пока пустой массив, потом передадим реальные данные
            />

            {/* Кнопка планирования интервью */}
            <ScheduleInterviewModal response={response} />

            {/* Кнопка экспорта данных */}
            <ExportCandidateModal response={response} />
          </div>
        </div>
      </CardHeader>

      {/* Key Info Summary */}
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {/* Resume Actions */}
          {hasResume && (
            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="p-2 bg-background rounded-md border">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium mb-3">Резюме кандидата</div>
                <div className="flex flex-wrap gap-2">
                  {response.resumeUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-8 text-xs"
                    >
                      <a
                        href={response.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        Открыть
                      </a>
                    </Button>
                  )}
                  {resumePdfUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-8 text-xs"
                    >
                      <a
                        href={resumePdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        PDF
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Platform Profile */}
          {hasProfile && (
            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="p-2 bg-background rounded-md border">
                <Globe className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium mb-1">
                  Профиль на платформе
                </div>
                <div className="text-xs text-muted-foreground mb-3 truncate">
                  {response.platformProfileUrl}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-8 text-xs"
                >
                  <a
                    href={response.platformProfileUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Перейти
                  </a>
                </Button>
              </div>
            </div>
          )}

          {response.salaryExpectationsAmount && (
            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="p-2 bg-background rounded-md border">
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium mb-1">
                  Зарплатные ожидания
                </div>
                <div className="text-xl font-semibold mb-2 font-mono tabular-nums">
                  {response.salaryExpectationsAmount.toLocaleString()}&nbsp;₽
                </div>
                {response.salaryExpectationsComment && (
                  <div className="text-xs text-muted-foreground">
                    {response.salaryExpectationsComment.length >
                    SALARY_COMMENT_PREVIEW_LENGTH ? (
                      isSalaryCommentExpanded ? (
                        <>
                          {response.salaryExpectationsComment}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsSalaryCommentExpanded(false)}
                            className="h-6 px-2 py-0 mt-2 text-xs"
                          >
                            <ChevronUp className="h-3 w-3 mr-1" />
                            Свернуть
                          </Button>
                        </>
                      ) : (
                        <>
                          {response.salaryExpectationsComment.slice(
                            0,
                            SALARY_COMMENT_PREVIEW_LENGTH,
                          )}
                          …
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsSalaryCommentExpanded(true)}
                            className="h-6 px-2 py-0 mt-2 text-xs"
                          >
                            <ChevronDown className="h-3 w-3 mr-1" />
                            Ещё
                          </Button>
                        </>
                      )
                    ) : (
                      response.salaryExpectationsComment
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Заметки HR */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Заметки HR
            </h4>
            {!isNoteEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsNoteEditing(true)}
                className="h-7 text-xs"
              >
                {hrNote ? "Редактировать" : "Добавить"}
              </Button>
            )}
          </div>

          {isNoteEditing ? (
            <div className="space-y-2">
              <Textarea
                placeholder="Добавьте внутренние заметки по кандидату..."
                value={hrNote}
                onChange={(e) => setHrNote(e.target.value)}
                className="min-h-[80px] text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleNoteSave}
                  className="h-7 text-xs"
                >
                  Сохранить
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNoteCancel}
                  className="h-7 text-xs"
                >
                  Отмена
                </Button>
              </div>
            </div>
          ) : hrNote ? (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {hrNote}
              </p>
            </div>
          ) : (
            <div className="p-4 border border-dashed border-muted-foreground/25 rounded-lg text-center text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Нет заметок</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
