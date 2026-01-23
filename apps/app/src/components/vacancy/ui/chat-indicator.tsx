import { paths } from "@qbs-autonaim/config";
import {
  cn,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@qbs-autonaim/ui";
import { MessageCircle } from "lucide-react";
import Link from "next/link";

interface ChatIndicatorProps {
  messageCount: number;
  conversationId: string;
  orgSlug: string;
  workspaceSlug: string;
  className?: string; // Added className prop
}

export function ChatIndicator({
  messageCount,
  conversationId,
  orgSlug,
  workspaceSlug,
  className,
}: ChatIndicatorProps) {
  if (messageCount === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={paths.workspace.chat(orgSlug, workspaceSlug, conversationId)}
            className={cn(
              "group inline-flex w-fit items-center gap-1.5 rounded-md border border-blue-200/40 bg-blue-50/50 px-2 py-0.5 text-[10px] font-medium text-blue-700 transition-all hover:bg-blue-100/60 hover:border-blue-300/60 hover:shadow-xs dark:border-blue-800/40 dark:bg-blue-950/30 dark:text-blue-400",
              className,
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <MessageCircle className="size-3 opacity-70 transition-opacity group-hover:opacity-100" />
            <span className="tabular-nums">{messageCount}</span>
            <span className="opacity-50">сообщ.</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start">
          <p className="font-semibold">Диалог активен</p>
          <p className="text-xs text-muted-foreground">
            Перейти к переписке ({messageCount} сообщений)
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
