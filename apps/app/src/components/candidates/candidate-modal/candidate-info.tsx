"use client";

import { Badge, Button } from "@qbs-autonaim/ui";
import { sanitizeHtmlFunction } from "@qbs-autonaim/shared/client";
import {
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Github,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Send,
  Sparkles,
  XCircle,
} from "lucide-react";
import { MatchScoreCircle } from "../match-score-circle";
import type { FunnelCandidateDetail } from "../types";
import { MetaMatchSection } from "./meta-match-section";

interface CandidateInfoProps {
  candidate: FunnelCandidateDetail;
  workspaceId: string;
  onAction?: (action: string) => void;
  isLoading?: {
    sendGreeting?: boolean;
    invite?: boolean;
    refreshResume?: boolean;
    rate?: boolean;
  };
}

export function CandidateInfo({
  candidate,
  workspaceId,
  onAction,
  isLoading = {},
}: CandidateInfoProps) {
  const getAvailabilityColor = () => {
    if (candidate.availability === "IMMEDIATE")
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800";
    if (candidate.availability === "TWO_WEEKS")
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800";
    return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800";
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Контакты</h3>
          <div className="space-y-3">
            {candidate.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{candidate.email}</span>
              </div>
            )}
            {candidate.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{candidate.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{candidate.location}</span>
            </div>
            {candidate.github && (
              <div className="flex items-center gap-3">
                <Github className="h-4 w-4 text-muted-foreground" />
                <a
                  href={candidate.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline hover:text-primary transition-colors truncate max-w-[200px]"
                >
                  {candidate.github.replace(/^https?:\/\/(www\.)?/, "")}
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Детали</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm">{candidate.salaryExpectation}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Badge
                variant="outline"
                className={`text-xs ${getAvailabilityColor()}`}
              >
                {candidate.availability}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {new Date(candidate.createdAt).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Результаты оценки</h3>
        <div className="grid grid-cols-2 gap-4">
          {candidate.resumeScore !== undefined && (
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <div className="flex items-center justify-center mb-2">
                <MatchScoreCircle score={candidate.resumeScore} size="md" />
              </div>
              <p className="text-xs text-muted-foreground">Скор резюме</p>
            </div>
          )}

          {candidate.interviewScore !== undefined && (
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <div className="flex items-center justify-center mb-2">
                <MatchScoreCircle score={candidate.interviewScore} size="md" />
              </div>
              <p className="text-xs text-muted-foreground">Скор интервью</p>
            </div>
          )}
        </div>
      </div>

      <MetaMatchSection
        candidateId={candidate.id}
        workspaceId={workspaceId}
        candidateData={candidate}
      />

      {candidate.screeningAnalysis && (
        <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-blue-500">
          <h3 className="text-sm font-medium mb-2">Анализ резюме</h3>
          <div
            className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtmlFunction(candidate.screeningAnalysis || ""),
            }}
          />
        </div>
      )}

      {candidate.scoreAnalysis && (
        <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
          <h3 className="text-sm font-medium mb-2">Анализ интервью</h3>
          <div
            className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtmlFunction(candidate.scoreAnalysis || ""),
            }}
          />
        </div>
      )}

      <div className="border-t pt-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="gap-2"
            onClick={() => onAction?.("send-greeting")}
            disabled={isLoading.sendGreeting}
            aria-label="Отправить приветственное сообщение кандидату"
          >
            {isLoading.sendGreeting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Отправить приветствие
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => onAction?.("invite")}
            disabled={isLoading.invite}
            aria-label="Пригласить кандидата на собеседование"
          >
            {isLoading.invite ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Пригласить
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => onAction?.("send-offer")}
            aria-label="Отправить оффер кандидату"
          >
            <Send className="h-4 w-4" />
            Отправить оффер
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 ml-auto text-destructive border-destructive hover:bg-destructive hover:text-white"
            onClick={() => onAction?.("reject")}
            aria-label="Отклонить кандидата"
          >
            <XCircle className="h-4 w-4" />
            Отклонить
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => onAction?.("rate")}
            disabled={isLoading.rate}
            aria-label="Оценить кандидата"
          >
            {isLoading.rate ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isLoading.rate ? "Оценка…" : "Оценить"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => onAction?.("view-resume")}
            aria-label="Открыть резюме кандидата"
          >
            <FileText className="h-4 w-4" />
            Резюме
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => onAction?.("download-resume")}
            aria-label="Скачать резюме кандидата"
          >
            <Download className="h-4 w-4" />
            Скачать резюме
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => onAction?.("refresh-resume")}
            disabled={isLoading.refreshResume}
            aria-label="Обновить резюме кандидата"
          >
            {isLoading.refreshResume ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Обновить резюме
          </Button>
        </div>
      </div>
    </div>
  );
}
