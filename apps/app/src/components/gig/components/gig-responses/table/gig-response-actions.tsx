"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@qbs-autonaim/ui/components/dropdown-menu";
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
    <div className="flex items-center justify-end">
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
            onClick={() => onMessage(responseId)}
            disabled={isProcessing}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Отправить сообщение
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onAccept(responseId)}
            disabled={isProcessing}
            className="text-emerald-600 focus:text-emerald-700"
          >
            <Check className="h-4 w-4 mr-2" />
            Принять
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onReject(responseId)}
            disabled={isProcessing}
            className="text-destructive focus:text-destructive"
          >
            <X className="h-4 w-4 mr-2" />
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
