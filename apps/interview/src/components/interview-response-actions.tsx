"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@qbs-autonaim/ui";
import { ExternalLink, MessageSquare, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";

interface InterviewResponseActionsProps {
  token: string;
  sessionId?: string;
  resumeUrl?: string | null;
}

export function InterviewResponseActions({
  token,
  sessionId,
  resumeUrl,
}: InterviewResponseActionsProps) {
  const router = useRouter();

  const handleOpenChat = () => {
    if (sessionId) {
      router.push(`/interview/${token}/chat?sessionId=${sessionId}`);
    }
  };

  const handleOpenResume = () => {
    if (resumeUrl) {
      window.open(resumeUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label="Действия"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleOpenChat} disabled={!sessionId}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Перейти в чат
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleOpenResume} disabled={!resumeUrl}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Открыть профиль
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
