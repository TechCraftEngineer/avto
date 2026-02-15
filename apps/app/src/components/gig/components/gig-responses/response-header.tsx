"use client";

import { Badge } from "@qbs-autonaim/ui";

interface ResponseHeaderProps {
  gigTitle: string;
  totalResponses: number;
}

export function ResponseHeader({
  gigTitle,
  totalResponses,
}: ResponseHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
          Отклики на задание
        </h1>
        <p className="mt-1 text-sm sm:text-base text-muted-foreground truncate">
          {gigTitle}
        </p>
      </div>
      <Badge
        variant="secondary"
        className="w-fit text-sm sm:text-base px-3 py-1.5 sm:px-4 sm:py-2 shrink-0 font-semibold bg-primary/10 text-primary border-primary/20"
      >
        {totalResponses}
      </Badge>
    </div>
  );
}
