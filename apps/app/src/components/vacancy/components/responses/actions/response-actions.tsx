"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@qbs-autonaim/ui/components/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import {
  Brain,
  ClipboardCopy,
  ExternalLink,
  Link2,
  Loader2,
  Mail,
  MoreVertical,
  Phone,
  RefreshCw,
  Send,
  UserCheck,
  UserX,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  triggerAnalyzeSingleResponse,
  triggerRefreshSingleResume,
  triggerSendWelcome,
} from "~/actions/trigger";
import { useORPC } from "~/orpc/react";
import { useAnalyzeSingleResponse } from "../hooks/use-analyze-single-response";
import { useCandidateOperations } from "../hooks/use-candidate-operations";
import { useRefreshSingleResume } from "../hooks/use-refresh-single-resume";

interface ResponseActionsProps {
  responseId: string;
  workspaceId: string;
  vacancyId?: string;
  resumeUrl?: string | null;
  telegramUsername?: string | null;
  phone?: string | null;
  email?: string | null;
  welcomeSentAt?: Date | null;
  importSource?: string | null;
  status?: string | null;
  hrSelectionStatus?: string | null;
  hasScreening?: boolean;
  candidateName?: string | null;
}

export function ResponseActions({
  responseId,
  workspaceId,
  vacancyId,
  resumeUrl,
  telegramUsername,
  phone,
  email,
  welcomeSentAt,
  importSource,
  hrSelectionStatus,
  hasScreening,
  candidateName,
}: ResponseActionsProps) {
  const [analyzeEnabled, setAnalyzeEnabled] = useState(false);
  const [refreshEnabled, setRefreshEnabled] = useState(false);
  const queryClient = useQueryClient();
  const orpc = useORPC();

  const { invite, reject, isInviting, isRejecting } = useCandidateOperations({
    workspaceId,
    vacancyId,
  });

  const {
    progress: analyzeProgress,
    result: analyzeResult,
    isAnalyzing,
    reset: resetAnalyze,
  } = useAnalyzeSingleResponse({
    responseId,
    enabled: analyzeEnabled,
  });

  const { progress, result, isRefreshing, reset } = useRefreshSingleResume({
    responseId,
    enabled: refreshEnabled,
  });

  // Обрабатываем результат обновления резюме
  useEffect(() => {
    if (!result) return;

    if (result.success) {
      toast.success("Резюме успешно обновлено");
      if (vacancyId) {
        void queryClient.invalidateQueries({
          queryKey: orpc.vacancy.responses.list.queryKey({ vacancyId }),
        });
      }
    } else {
      toast.error(result.error || "Не удалось обновить резюме");
    }

    setRefreshEnabled(false);

    const timer = setTimeout(() => {
      reset();
    }, 3000);

    return () => clearTimeout(timer);
  }, [
    result,
    reset,
    queryClient,
    vacancyId,
    orpc.vacancy.responses.list.queryKey,
  ]);

  // Обрабатываем результат AI-оценки
  useEffect(() => {
    if (!analyzeResult) return;

    if (analyzeResult.success) {
      toast.success("AI-оценка завершена");
      if (vacancyId) {
        void queryClient.invalidateQueries({
          queryKey: orpc.vacancy.responses.list.queryKey({ vacancyId }),
        });
      }
    } else {
      toast.error(analyzeResult.error || "Не удалось выполнить AI-оценку");
    }

    setAnalyzeEnabled(false);

    const timer = setTimeout(() => {
      resetAnalyze();
    }, 3000);

    return () => clearTimeout(timer);
  }, [
    analyzeResult,
    resetAnalyze,
    queryClient,
    vacancyId,
    orpc.vacancy.responses.list.queryKey,
  ]);

  const handleAnalyze = async () => {
    try {
      const triggerResult = await triggerAnalyzeSingleResponse(
        responseId,
        workspaceId,
      );
      if (triggerResult.success) {
        setAnalyzeEnabled(true);
      } else {
        toast.error("Не удалось запустить оценку");
      }
    } catch {
      toast.error("Не удалось запустить оценку");
    }
  };

  const handleRefreshResume = async () => {
    try {
      const triggerResult = await triggerRefreshSingleResume(responseId);

      if (!triggerResult.success) {
        toast.error("Не удалось запустить обновление резюме");
        return;
      }

      toast.success("Обновление резюме запущено");
      setRefreshEnabled(true);
    } catch {
      toast.error("Не удалось запустить обновление резюме");
    }
  };

  const handleSendWelcome = async () => {
    try {
      const welcomeResult = await triggerSendWelcome(
        responseId,
        telegramUsername,
        phone,
      );
      if (welcomeResult.success) {
        toast.success("Приветствие отправлено");
        invalidateList();
      } else {
        toast.error("Не удалось отправить приветствие");
      }
    } catch {
      toast.error("Не удалось отправить приветствие");
    }
  };

  const handleInvite = () => {
    invite(responseId);
  };

  const handleReject = () => {
    reject(responseId);
  };

  const handleCopyContacts = () => {
    const parts: string[] = [];
    if (candidateName) parts.push(candidateName);
    if (phone) parts.push(`Тел: ${phone}`);
    if (email) parts.push(`Email: ${email}`);
    if (telegramUsername) parts.push(`Telegram: @${telegramUsername}`);

    const text = parts.join("\n");
    void navigator.clipboard.writeText(text).then(() => {
      toast.success("Контакты скопированы");
    });
  };

  const handleCopyInterviewLink = async () => {
    try {
      const result = await queryClient.fetchQuery(
        orpc.vacancy.responses.getInterviewLink.queryOptions({
          responseId,
          workspaceId,
        }),
      );

      await navigator.clipboard.writeText(result.url);
      toast.success("Ссылка на интервью скопирована");
    } catch {
      toast.error("Не удалось получить ссылку на интервью");
    }
  };

  const isLoading = isRefreshing || isAnalyzing || isInviting || isRejecting;

  const hasContacts = !!(telegramUsername || phone || email);
  const isRejected = hrSelectionStatus === "REJECTED";
  const isInvited = hrSelectionStatus === "INVITE";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={isLoading}
          aria-label="Действия с откликом"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreVertical className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {/* Группа 1: Быстрая оценка */}
        <DropdownMenuItem onClick={handleAnalyze} disabled={isAnalyzing}>
          <Brain
            className={`h-4 w-4 mr-2 ${isAnalyzing ? "animate-pulse" : ""}`}
          />
          {isAnalyzing
            ? analyzeProgress?.message || "Оценка запущена…"
            : hasScreening
              ? "Переоценить AI"
              : "Оценить AI"}
        </DropdownMenuItem>

        {!isInvited && !isRejected && (
          <DropdownMenuItem onClick={handleInvite} disabled={isInviting}>
            <UserCheck className="h-4 w-4 mr-2" />
            {isInviting ? "Приглашение…" : "Пригласить на собеседование"}
          </DropdownMenuItem>
        )}

        {!isRejected && (
          <DropdownMenuItem
            onClick={handleReject}
            disabled={isRejecting}
            className="text-destructive focus:text-destructive"
          >
            <UserX className="h-4 w-4 mr-2" />
            {isRejecting ? "Отклонение…" : "Отклонить"}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Группа 2: Коммуникация */}
        {!welcomeSentAt && importSource === "HH" && (
          <DropdownMenuItem onClick={handleSendWelcome}>
            <Send className="h-4 w-4 mr-2" />
            Отправить приветствие HH.ru
          </DropdownMenuItem>
        )}

        {email && (
          <DropdownMenuItem
            onClick={() =>
              window.open(`mailto:${email}`, "_blank", "noopener,noreferrer")
            }
          >
            <Mail className="h-4 w-4 mr-2" />
            Написать на email
          </DropdownMenuItem>
        )}

        {telegramUsername && (
          <DropdownMenuItem
            onClick={() =>
              window.open(
                `https://t.me/${telegramUsername}`,
                "_blank",
                "noopener,noreferrer",
              )
            }
          >
            <Send className="h-4 w-4 mr-2" />
            Написать в Telegram
          </DropdownMenuItem>
        )}

        {phone && (
          <DropdownMenuItem onClick={() => window.open(`tel:${phone}`)}>
            <Phone className="h-4 w-4 mr-2" />
            Позвонить: {phone}
          </DropdownMenuItem>
        )}

        {hasContacts && (
          <DropdownMenuItem onClick={handleCopyContacts}>
            <ClipboardCopy className="h-4 w-4 mr-2" />
            Скопировать контакты
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={handleCopyInterviewLink}>
          <Link2 className="h-4 w-4 mr-2" />
          Скопировать ссылку на интервью
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Группа 3: Резюме */}
        {resumeUrl && (
          <>
            <DropdownMenuItem
              onClick={handleRefreshResume}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing
                ? progress?.message || "Обновление…"
                : "Обновить резюме с HH.ru"}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() =>
                window.open(resumeUrl, "_blank", "noopener,noreferrer")
              }
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Открыть резюме на HH.ru
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
