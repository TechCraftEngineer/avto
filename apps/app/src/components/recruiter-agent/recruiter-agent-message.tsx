"use client";

import { cn } from "@qbs-autonaim/ui";
import { Sparkles, User } from "lucide-react";
import { memo } from "react";
import type { ConversationMessage } from "~/hooks/use-recruiter-agent";
import { formatIntent } from "./utils";

interface RecruiterAgentMessageProps {
  message: ConversationMessage;
}

const RecruiterAgentMessage = memo(function RecruiterAgentMessage({
  message,
}: RecruiterAgentMessageProps) {
  const isUser = message.role === "user";

  return (
    <article
      className="group/message w-full animate-in fade-in duration-200"
      data-role={message.role}
    >
      <div
        className={cn("flex w-full items-start gap-3", {
          "flex-row-reverse": isUser,
        })}
      >
        {/* Аватар ассистента */}
        {!isUser && (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
            <Sparkles className="size-4" />
          </div>
        )}

        <div
          className={cn("flex flex-col", {
            "items-start": !isUser,
            "items-end": isUser,
          })}
        >
          <div
            className={cn(
              "max-w-[85%] sm:max-w-[70%] wrap-break-word rounded-2xl px-4 py-2",
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground",
            )}
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </p>
          </div>

          {/* Метаданные для ассистента */}
          {!isUser && message.metadata?.intent && (
            <div className="mt-2 flex items-center gap-2 text-muted-foreground text-xs">
              <span className="rounded bg-background px-2 py-1 border">
                {formatIntent(message.metadata.intent)}
              </span>
              {message.metadata.actions &&
                message.metadata.actions.length > 0 && (
                  <span className="text-muted-foreground">
                    {message.metadata.actions.length} действий выполнено
                  </span>
                )}
            </div>
          )}
        </div>

        {/* Аватар пользователя */}
        {isUser && (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary">
            <User className="size-4 text-primary-foreground" />
          </div>
        )}
      </div>
    </article>
  );
});

RecruiterAgentMessage.displayName = "RecruiterAgentMessage";

export { RecruiterAgentMessage };
