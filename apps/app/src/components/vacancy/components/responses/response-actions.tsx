"use client";

import Button from "@qbs-autonaim/ui/button";
import { MessageSquare, Phone, Send } from "lucide-react";

interface ResponseActionsProps {
  responseId: string;
  resumeUrl?: string | null;
  candidateName?: string | null;
  telegramUsername?: string | null;
  phone?: string | null;
}

export function ResponseActions({
  responseId: _responseId,
  resumeUrl: _resumeUrl,
  candidateName: _candidateName,
  telegramUsername,
  phone,
}: ResponseActionsProps) {
  return (
    <div className="flex gap-2">
      {telegramUsername && (
        <Button variant="outline" size="sm">
          <Send className="h-4 w-4 mr-1" />
          Telegram
        </Button>
      )}
      {phone && (
        <Button variant="outline" size="sm">
          <Phone className="h-4 w-4 mr-1" />
          Позвонить
        </Button>
      )}
      <Button variant="outline" size="sm">
        <MessageSquare className="h-4 w-4 mr-1" />
        Сообщение
      </Button>
    </div>
  );
}

