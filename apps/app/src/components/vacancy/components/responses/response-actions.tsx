"use client";

import { Button } from "@qbs-autonaim/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@qbs-autonaim/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@qbs-autonaim/ui/tooltip";
import {
  ExternalLink,
  MessageSquare,
  MoreVertical,
  Phone,
  RefreshCw,
  Send,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ResponseActionsProps {
  responseId: string;
  resumeUrl?: string | null;
  candidateName?: string | null;
  telegramUsername?: string | null;
  phone?: string | null;
  welcomeSentAt?: Date | null;
  onRefreshResume?: () => Promise<void>;
  onSendWelcome?: () => Promise<void>;
}

export function ResponseActions({
  responseId: _responseId,
  resumeUrl,
  candidateName,
  telegramUsername,
  phone,
  welcomeSentAt,
  onRefreshResume,
  onSendWelcome,
}: ResponseActionsProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSendingWelcome, setIsSendingWelcome] = useState(false);

  const handleRefreshResume = async () => {
    if (!onRefreshResume) return;
    setIsRefreshing(true);
    try {
      await onRefreshResume();
      toast.success("Резюме успешно обновлено");
    } catch (error) {
      toast.error("Не удалось обновить резюме");
      console.error("Ошибка обновления резюме:", error);
    } finally {
      setIsRefreshing(false);
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

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1">
        {/* Обновить резюме с HH.ru */}
        {resumeUrl && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-400"
                onClick={handleRefreshResume}
                disabled={isRefreshing}
                aria-label="Обновить резюме с HH.ru"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-xs font-medium">Обновить резюме с HH.ru</p>
              <p className="text-xs text-muted-foreground mt-1">
                Загрузить актуальную версию резюме
              </p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Отправить приветствие */}
        {!welcomeSentAt && (telegramUsername || phone) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950 dark:hover:text-green-400"
                onClick={handleSendWelcome}
                disabled={isSendingWelcome}
                aria-label={`Отправить приветствие ${telegramUsername ? "в Telegram" : "по телефону"}`}
              >
                <Send className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-xs font-medium">
                Отправить приветствие{" "}
                {telegramUsername ? "в Telegram" : "по телефону"}
              </p>
              {candidateName && (
                <p className="text-xs text-muted-foreground mt-1">
                  Кандидат: {candidateName}
                </p>
              )}
              {telegramUsername && (
                <p className="text-xs text-muted-foreground">
                  @{telegramUsername}
                </p>
              )}
              {phone && !telegramUsername && (
                <p className="text-xs text-muted-foreground">{phone}</p>
              )}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Дополнительные действия */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  aria-label="Дополнительные действия"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">Дополнительные действия</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-56">
            {resumeUrl && (
              <>
                <DropdownMenuItem
                  onClick={() =>
                    window.open(resumeUrl, "_blank", "noopener,noreferrer")
                  }
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Открыть резюме на HH.ru
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
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

            {(telegramUsername || phone) && <DropdownMenuSeparator />}

            <DropdownMenuItem disabled>
              <MessageSquare className="h-4 w-4 mr-2" />
              Отправить сообщение
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
}
