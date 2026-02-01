"use client";

/**
 * TypingIndicator - Animated dots while AI is generating response
 * Requirements: 8.3
 * Subtask 7.5: Animated typing indicator
 */
export function TypingIndicator() {
  return (
    <div className="border-t bg-gray-50 px-4 pb-2 pt-4">
      <output
        className="flex items-center gap-1 rounded-lg bg-white px-4 py-3 shadow-sm"
        aria-live="polite"
        aria-label="AI помощник печатает"
      >
        <span className="sr-only">AI помощник печатает</span>
        <div
          className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
          style={{ animationDelay: "0ms" }}
          aria-hidden="true"
        />
        <div
          className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
          style={{ animationDelay: "150ms" }}
          aria-hidden="true"
        />
        <div
          className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
          style={{ animationDelay: "300ms" }}
          aria-hidden="true"
        />
      </output>
    </div>
  );
}
