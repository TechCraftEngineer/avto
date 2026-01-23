"use client";

import { Loader2 } from "lucide-react";
import { formatActionType } from "./utils";

interface ActionProgressIndicatorProps {
  actionType: string;
  progress: number;
}

export function ActionProgressIndicator({
  actionType,
  progress,
}: ActionProgressIndicatorProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
        <Loader2 className="size-4 animate-spin text-primary" />
      </div>
      <div className="flex-1 py-2">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-foreground font-medium">
            {formatActionType(actionType)}
          </span>
          <span className="text-muted-foreground">{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
