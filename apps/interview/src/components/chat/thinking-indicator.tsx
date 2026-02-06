import { Sparkles } from "lucide-react";

export function ThinkingIndicator() {
  return (
    <output
      className="group/message fade-in block w-full animate-in duration-300"
      data-role="assistant"
      aria-label="AI думает"
    >
      <div className="flex items-start justify-start gap-3">
        <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
          <div className="animate-pulse">
            <Sparkles className="size-4 text-primary" />
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 md:gap-4">
          <div className="flex items-center gap-1 p-0 text-muted-foreground text-sm">
            <span className="animate-pulse">Думаю</span>
            <span className="inline-flex">
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
