"use client";

import { Sparkles } from "lucide-react";

/**
 * Индикатор "думает" для AI чата
 * Адаптирован из ai-chatbot ThinkingMessage
 */
export function ThinkingIndicator() {
  return (
    <output
      className="group/message block w-full animate-in fade-in duration-300"
      data-role="assistant"
      aria-live="polite"
      aria-label="Ассистент думает"
    >
      <div className="flex items-start justify-start gap-3">
        <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
          <div className="animate-pulse">
            <Sparkles className="size-4" aria-hidden="true" />
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 md:gap-4">
          <div className="flex items-center gap-1 p-0 text-muted-foreground text-sm">
            <span className="animate-pulse">Думаю</span>
            <span className="inline-flex" aria-hidden="true">
              <span className="animate-bounce [animation-delay:0ms]">.</span>
              <span className="animate-bounce [animation-delay:150ms]">.</span>
              <span className="animate-bounce [animation-delay:300ms]">.</span>
            </span>
          </div>
        </div>
      </div>
    </output>
  );
}
