"use client";

import { Button } from "@qbs-autonaim/ui/components/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@qbs-autonaim/ui/components/dropdown-menu";
import { ExternalLink, MessageSquare, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { z } from "zod";

interface InterviewResponseActionsProps {
  token: string;
  sessionId?: string;
  resumeUrl?: string | null;
}

const safeUrlSchema = z
  .string()
  .url()
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "URL должен использовать протокол HTTP или HTTPS" },
  );

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
    if (!resumeUrl) return;

    const validation = safeUrlSchema.safeParse(resumeUrl);
    if (!validation.success) {
      console.error("Небезопасный URL:", validation.error);
      return;
    }

    window.open(resumeUrl, "_blank", "noopener,noreferrer");
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
