"use client";

import { Loader2 } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground md:text-sm">
      <Loader2 className="h-3 w-3 animate-spin" />
      <span>Генерирую…</span>
    </div>
  );
}
