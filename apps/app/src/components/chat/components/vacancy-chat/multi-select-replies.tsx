"use client";

import { Button, cn } from "@qbs-autonaim/ui";
import { Check } from "lucide-react";
import { useState } from "react";
import type { QuickReply } from "./types";

interface MultiSelectRepliesProps {
  replies: QuickReply[];
  onSubmit: (values: string[]) => Promise<void>;
  disabled: boolean;
}

export function MultiSelectReplies({
  replies,
  onSubmit,
  disabled,
}: MultiSelectRepliesProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelection = (value: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (selected.size === 0) return;
    onSubmit(Array.from(selected));
  };

  return (
    <div className="space-y-3 pt-2">
      <p className="text-xs text-muted-foreground">
        Выберите один или несколько вариантов:
      </p>
      <div className="flex flex-wrap gap-2">
        {replies.map((reply) => {
          const isSelected = selected.has(reply.value);
          return (
            <button
              key={reply.id}
              type="button"
              onClick={() => toggleSelection(reply.value)}
              disabled={disabled}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-2 text-xs transition-all",
                "hover:scale-[1.02] active:scale-[0.98]",
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:bg-muted/50",
                disabled && "cursor-not-allowed opacity-50",
              )}
              style={{ touchAction: "manipulation" }}
              aria-pressed={isSelected}
            >
              <div
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30",
                )}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </div>
              {reply.label}
            </button>
          );
        })}
      </div>
      <Button
        onClick={handleSubmit}
        disabled={disabled || selected.size === 0}
        size="sm"
        className="transition-all hover:scale-[1.02] active:scale-[0.98]"
        style={{ touchAction: "manipulation" }}
      >
        Подтвердить выбор ({selected.size})
      </Button>
    </div>
  );
}
