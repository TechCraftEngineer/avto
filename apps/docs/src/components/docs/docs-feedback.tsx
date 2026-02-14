"use client";

import { Button } from "@qbs-autonaim/ui";
import { Check, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";

export function DocsFeedback() {
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(
    null,
  );

  const handleFeedback = (type: "positive" | "negative") => {
    setFeedback(type);
    // Здесь можно отправить аналитику
    console.log(`[v0] User feedback: ${type}`);
  };

  if (feedback) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3">
        <Check className="h-4 w-4 text-primary" />
        <p className="text-sm text-muted-foreground">Спасибо за отзыв!</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/50 px-4 py-3">
      <p className="text-sm text-muted-foreground">
        Была ли эта страница полезной?
      </p>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFeedback("positive")}
          className="h-8 gap-2 hover:bg-background"
        >
          <ThumbsUp className="h-4 w-4" />
          Да
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFeedback("negative")}
          className="h-8 gap-2 hover:bg-background"
        >
          <ThumbsDown className="h-4 w-4" />
          Нет
        </Button>
      </div>
    </div>
  );
}
