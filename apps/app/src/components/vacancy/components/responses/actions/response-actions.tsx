"use client";

import { Button } from "@qbs-autonaim/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@qbs-autonaim/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useTRPC } from "~/trpc/react";
import { useRefreshSingleResume } from "../hooks/use-refresh-single-resume";

interface ResponseActionsProps {
  responseId: string;
  workspaceId: string;
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [refreshEnabled, setRefreshEnabled] = useState(false);
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { progress, result, isRefreshing, reset } = useRefreshSingleResume({
    responseId,
    enabled: refreshEnabled,
  });

  // Мутация для приглашения кандидата
  const inviteMutation = useMutation(
    trpc.candidates.inviteCandidate.mutationOptions({
      onSuccess: () => {
        toast.success("Кандидат приглашён на собеседование");
        void queryClient.invalidateQueries({
          queryKey: trpc.vacancy.responses.list.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(error.message || "Не удалось пригласить кандидата");
      },
    }),
  );

  // Мутация для отклонения кандидата
  const rejectMutation = useMutation(
    trpc.candidates.rejectCandidate.mutationOptions({
      onSuccess: () => {
        toast.success("Кандидат отклонён");
        void queryClient.invalidateQueries({
          queryKey: trpc.vacancy.responses.list.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(error.message || "Не удалось отклонить кандидата");
      },
    }),
  );

  // Обрабатываем результат обновления резюме
  useEffect(() => {
    if (!result) return;

    if (result.success) {
      toast.success("Резюме успешно обновлено");
      void queryClient.invalidateQueries({
        queryKey: trpc.vacancy.responses.list.queryKey(),
      });
    } else {
      toast.error(result.error || "Не удалось обновить резюме");
    }

    const timer = setTimeout(() => {
      reset();
      setRefreshEnabled(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [result, reset, queryClient, trpc]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const analyzeResult = await triggerAnalyzeSingleResponse(
        responseId,
        workspaceId,
      );
      if (analyzeResult.success) {
        toast.success("AI-оценка запущена");
      } else {
        toast.error("Не удалось запустить оценку");
      }
    } catch {
      toast.error("Не удалось запустить оценку");
    } finally {
      setIsAnalyzing(false);
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
        void queryClient.invalidateQueries({
          queryKey: trpc.vacancy.responses.list.queryKey(),
        });
      } else {
        toast.error("Не удалось отправить приветствие");
      }
    } catch {
      toast.error("Не удалось отправить приветствие");
    }
  };

  const handleInvite = () => {
    inviteMutation.mutate({
      candidateId: responseId,
      workspaceId,
    });
  };

  const handleReject = () => {
    rejectMutation.mutate({
      candidateId: responseId,
      workspaceId,
    });
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
      const result = await trpc.vacancy.responses.getInterviewLink.query({
        responseId,
        workspaceId,
      });

      await navigator.clipboard.writeText(result.url);
      toast.success("Ссылка на интервью скопирована");
    } catch {
      toast.error("Не удалось получить ссылку на интервью");
    }
  };

  const isLoading =
    isRefreshing ||
    isAnalyzing ||
    inviteMutation.isPending ||
    rejectMutation.isPending;

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
            ? "Оценка запущена…"
            : hasScreening
              ? "Переоценить AI"
              : "Оценить AI"}
        </DropdownMenuItem>

        {!isInvited && !isRejected && (
          <DropdownMenuItem
            onClick={handleInvite}
            disabled={inviteMutation.isPending}
          >
            <UserCheck className="h-4 w-4 mr-2" />
            {inviteMutation.isPending
              ? "Приглашение…"
              : "Пригласить на собеседование"}
          </DropdownMenuItem>
        )}

        {!isRejected && (
          <DropdownMenuItem
            onClick={handleReject}
            disabled={rejectMutation.isPending}
            className="text-destructive focus:text-destructive"
          >
            <UserX className="h-4 w-4 mr-2" />
            {rejectMutation.isPending ? "Отклонение…" : "Отклонить"}
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
