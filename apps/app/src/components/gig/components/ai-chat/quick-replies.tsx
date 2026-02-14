"use client";

import { Button } from "@qbs-autonaim/ui";

interface QuickRepliesProps {
  replies: string[];
  onSelect: (reply: string) => void;
  disabled: boolean;
}

/**
 * QuickReplies - Quick reply buttons below AI messages
 * Requirements: 7.5, 8.5
 * Subtask 7.4: Clickable buttons that send text as new message
 */
export function QuickReplies({
  replies,
  onSelect,
  disabled,
}: QuickRepliesProps) {
  if (!replies || replies.length === 0) {
    return null;
  }

  return (
    <div className="border-t bg-gray-50 p-4">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        Быстрые вопросы:
      </p>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Быстрые ответы</legend>
        {replies.map((reply) => (
          <Button
            key={reply}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelect(reply)}
            disabled={disabled}
            className="transition-all duration-200 hover:scale-105 active:scale-95 disabled:scale-100"
            style={{ touchAction: "manipulation" }}
            aria-label={`Отправить: ${reply}`}
          >
            {reply}
          </Button>
        ))}
      </fieldset>
    </div>
  );
}
