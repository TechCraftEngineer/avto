"use client";

import { Button } from "@qbs-autonaim/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@qbs-autonaim/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import {
  ExternalLink,
  Loader2,
  MessageSquare,
  MoreVertical,
  Phone,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { triggerRefreshSingleResume } from "~/actions/trigger";
import { useTRPC } from "~/trpc/react";
import { useRefreshSingleResume } from "./use-refresh-single-resume";

interface ResponseActionsProps {
  responseId: string;
  resumeUrl?: string | null;
  telegramUsername?: string | null;
  phone?: string | null;
  welcomeSentAt?: Date | null;
  onSendWelcome?: () => Promise<void>;
  onAnalyzeClick?: () => void;
}

export function ResponseActions({
  responseId,
  resumeUrl,
  telegramUsername,
  phone,
  welcomeSentAt,
  onSendWelcome,
  onAnalyzeClick,
}: ResponseActionsProps) {
  const [isSendingWelcome, setIsSendingWelcome] = useState(false);
  const [refreshEnabled, setRefreshEnabled] = useState(false);
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { progress, result, isRefreshing, reset } = useRefreshSingleResume({
    responseId,
    enabled: refreshEnabled,
  });

  // Обрабатываем результат обновления
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

  const handleRefreshResume = async () => {
    try {
      const triggerResult = await triggerRefreshSingleResume(responseId);

      if (!triggerResult.success) {
        toast.error("Не удалось запустить обновление резюме");
        return;
      }

      toast.success("Обновление резюме запущено");
      setRefreshEnabled(true);
    } catch (error) {
      toast.error("Не удалось запустить обновление резюме");
      console.error("Ошибка запуска обновления резюме:", error);
    }
  };

  const handleSendWelcome = async () => {
    if (!onSendWelcome) return;
    setIsSendingWelcome(true);
    try {
      await onSendWelcome();
      toast.success("Приветствие отправлено");
    } catch (error) {
      toast.error("Не удалось отправить приветствие");
      console.error("Ошибка отправки приветствия:", error);
    } finally {
      setIsSendingWelcome(false);
    }
  };

  const isLoading = isRefreshing || isSendingWelcome;

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
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onAnalyzeClick}>
          <Sparkles className="h-4 w-4 mr-2" />
          Проанализировать отклик
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {/* Обновить резюме */}
        {resumeUrl && (
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
        )}

        {/* Отправить приветствие */}
        {!welcomeSentAt && (telegramUsername || phone) && (
          <DropdownMenuItem
            onClick={handleSendWelcome}
            disabled={isSendingWelcome}
          >
            <Send className="h-4 w-4 mr-2" />
            Отправить приветствие{" "}
            {telegramUsername ? "в Telegram" : "по телефону"}
          </DropdownMenuItem>
        )}

        {(resumeUrl || (!welcomeSentAt && (telegramUsername || phone))) && (
          <DropdownMenuSeparator />
        )}

        {/* Открыть резюме */}
        {resumeUrl && (
          <DropdownMenuItem
            onClick={() =>
              window.open(resumeUrl, "_blank", "noopener,noreferrer")
            }
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Открыть резюме на HH.ru
          </DropdownMenuItem>
        )}

        {/* Контакты */}
        {(telegramUsername || phone) && (
          <>
            {resumeUrl && <DropdownMenuSeparator />}
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
          </>
        )}

        <DropdownMenuSeparator />

        {/* Отправить сообщение (будущая функция) */}
        <DropdownMenuItem disabled>
          <MessageSquare className="h-4 w-4 mr-2" />
          Отправить сообщение
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
