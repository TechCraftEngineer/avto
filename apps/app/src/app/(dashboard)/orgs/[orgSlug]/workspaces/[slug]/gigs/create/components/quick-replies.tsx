"use client";

import { Button } from "@qbs-autonaim/ui";

interface QuickRepliesProps {
  replies: string[];
  onSelect: (reply: string) => void;
  disabled?: boolean;
}

export function QuickReplies({
  replies,
  onSelect,
  disabled = false,
}: QuickRepliesProps) {
  if (!replies.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {replies.map((reply) => (
        <Button
          key={reply}
          variant="outline"
          size="sm"
          onClick={() => onSelect(reply)}
          disabled={disabled}
          className="rounded-full hover:bg-primary hover:text-primary-foreground transition-colors min-h-[44px]"
          style={{ touchAction: "manipulation" }}
        >
          {reply}
        </Button>
      ))}
    </div>
  );
}
