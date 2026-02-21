import { cn } from "@qbs-autonaim/ui/utils";
import { Sparkles } from "lucide-react";
import { memo } from "react";
import Markdown from "react-markdown";
import type { ChatMessage } from "~/types/chat";

interface MessageProps {
  message: ChatMessage;
  isLoading?: boolean;
}

export const Message = memo(function Message({
  message,
  isLoading,
}: MessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className="group/message fade-in w-full animate-in duration-200"
      data-role={message.role}
    >
      <div
        className={cn("flex w-full items-start gap-2 md:gap-3", {
          "justify-end": isUser,
          "justify-start": !isUser,
        })}
      >
        {!isUser && (
          <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
            <Sparkles className="size-4 text-primary" />
          </div>
        )}

        <div
          className={cn("flex flex-col gap-2", {
            "max-w-[calc(100%-2.5rem)] sm:max-w-[min(fit-content,80%)]": isUser,
            "w-full": !isUser,
          })}
        >
          {message.parts.map((part, index) => {
            if (part.type === "file" && part.url) {
              return (
                <div key={`${message.id}-file-${index}`} className="mb-2">
                  {/* biome-ignore lint/a11y/useMediaCaption: голосовое сообщение */}
                  <audio
                    controls
                    src={part.url}
                    className="h-10 max-w-[250px]"
                    aria-label="Голосовое сообщение"
                  />
                </div>
              );
            }

            if (part.type === "text" && part.text) {
              if (isUser) {
                return (
                  <div
                    key={`${message.id}-text-${index}`}
                    className="wrap-break-word rounded-2xl bg-primary px-3 py-2 text-primary-foreground"
                  >
                    <p className="whitespace-pre-wrap">{part.text}</p>
                  </div>
                );
              }

              return (
                <div
                  key={`${message.id}-text-${index}`}
                  className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                >
                  <Markdown
                    components={{
                      p: ({ children }) => <p>{children}</p>,
                      strong: ({ children }) => <strong>{children}</strong>,
                      em: ({ children }) => <em>{children}</em>,
                      code: ({ children }) => <code>{children}</code>,
                      pre: ({ children }) => <pre>{children}</pre>,
                      ul: ({ children }) => <ul>{children}</ul>,
                      ol: ({ children }) => <ol>{children}</ol>,
                      li: ({ children }) => <li>{children}</li>,
                    }}
                  >
                    {part.text}
                  </Markdown>
                </div>
              );
            }

            return null;
          })}

          {isLoading && !isUser && message.parts.length === 0 && (
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <span className="animate-pulse">Генерирую</span>
              <span className="inline-flex">
                <span className="animate-bounce [animation-delay:0ms]">.</span>
                <span className="animate-bounce [animation-delay:150ms]">
                  .
                </span>
                <span className="animate-bounce [animation-delay:300ms]">
                  .
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
