"use client";

import { Button } from "@qbs-autonaim/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@qbs-autonaim/ui";
import {
  Check,
  ClipboardCopy,
  Mail,
  MessageSquare,
  MoreVertical,
  Phone,
  Send,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface GigResponseActionsProps {
  responseId: string;
  candidateName?: string | null;
  telegramUsername?: string | null;
  phone?: string | null;
  email?: string | null;
  onAccept: (responseId: string) => void;
  onReject: (responseId: string) => void;
  onMessage: (responseId: string) => void;
  isProcessing: boolean;
}

export function GigResponseActions({
  responseId,
  candidateName,
  telegramUsername,
  phone,
  email,
  onAccept,
  onReject,
  onMessage,
  isProcessing,
}: GigResponseActionsProps) {
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

  const hasContacts = !!(telegramUsername || phone || email);

  return (
    <div className="flex items-center justify-end gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onMessage(responseId)}
          className="h-8 w-8 p-0 touch-manipulation"
          title="Отправить сообщение"
          aria-label={`Отправить сообщение кандидату ${candidateName || "без имени"}`}
          disabled={isProcessing}
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onAccept(responseId)}
          className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 touch-manipulation"
          title="Принять"
          aria-label={`Принять кандидата ${candidateName || "без имени"}`}
          disabled={isProcessing}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onReject(responseId)}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 touch-manipulation"
          title="Отклонить"
          aria-label={`Отклонить кандидата ${candidateName || "без имени"}`}
          disabled={isProcessing}
        >
          <X className="h-4 w-4" />
        </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={isProcessing}
            aria-label="Действия с откликом"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={() => onAccept(responseId)}
            disabled={isProcessing}
            className="text-emerald-600 focus:text-emerald-700"
          >
            Принять
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onReject(responseId)}
            disabled={isProcessing}
            className="text-destructive focus:text-destructive"
          >
            Отклонить
          </DropdownMenuItem>
          <DropdownMenuSeparator />
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
              Позвонить
            </DropdownMenuItem>
          )}
          {hasContacts && (
            <DropdownMenuItem onClick={handleCopyContacts}>
              <ClipboardCopy className="h-4 w-4 mr-2" />
              Скопировать контакты
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
