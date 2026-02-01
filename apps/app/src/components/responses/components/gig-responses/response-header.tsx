"use client";

import {
  Badge,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui";

interface ResponseHeaderProps {
  gigTitle: string;
  totalResponses: number;
}

export function ResponseHeader({
  gigTitle,
  totalResponses,
}: ResponseHeaderProps) {
  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-xl sm:text-2xl font-semibold break-words">
              Отклики на задание
            </CardTitle>
            <CardDescription className="mt-2 text-sm sm:text-base break-words text-muted-foreground">
              {gigTitle}
            </CardDescription>
          </div>
          <Badge
            variant="secondary"
            className="text-sm sm:text-base px-3 py-1.5 sm:px-4 sm:py-2 shrink-0 font-semibold bg-primary/10 text-primary border-primary/20"
          >
            {totalResponses}
          </Badge>
        </div>
      </CardHeader>
    </Card>
  );
}
