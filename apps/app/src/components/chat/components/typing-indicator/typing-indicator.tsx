"use client";

export function TypingIndicator() {
  return (
    <div className="bg-gray-50 px-4 pb-2">
      <div className="mx-auto max-w-4xl">
        <div className="flex justify-start">
          <output
            className="flex items-center gap-1 rounded-lg bg-white px-4 py-3 shadow-sm"
            aria-live="polite"
            aria-label="Ассистент печатает"
          >
            <span className="sr-only">Ассистент печатает</span>
            <div
              className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
              style={{ animationDelay: "300ms" }}
            />
          </output>
        </div>
      </div>
    </div>
  );
}
