"use client";

import { Card, CardContent } from "@qbs-autonaim/ui";
import { MessageSquare } from "lucide-react";

interface EmptyStateProps {
  hasFilters: boolean;
}

export function EmptyState({ hasFilters }: EmptyStateProps) {
  return (
    <Card className="border shadow-sm">
      <CardContent>
        <div className="text-center py-8 sm:py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted mb-4 sm:mb-6">
            <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/60" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">
            Нет откликов
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground px-4 max-w-md mx-auto">
            {hasFilters
              ? "Попробуйте изменить фильтры поиска"
              : "Пока что никто не откликнулся на это задание"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
