"use client";

import { Badge, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@qbs-autonaim/ui";
import { Sparkles } from "lucide-react";

interface PriorityBadgeProps {
  priorityScore: number;
  explanation?: string;
  reasons?: string[];
  className?: string;
}

/**
 * Компонент бейджа приоритета кандидата
 * Показывает приоритетный score и объяснение
 */
export function PriorityBadge({
  priorityScore,
  explanation,
  reasons,
  className,
}: PriorityBadgeProps) {
  // Определяем уровень приоритета
  const isHighPriority = priorityScore >= 70;
  const isMediumPriority = priorityScore >= 50 && priorityScore < 70;

  if (!isHighPriority && !isMediumPriority) {
    return null;
  }

  const variant = isHighPriority ? "default" : "secondary";
  const label = isHighPriority ? "Приоритетный" : "Важный";

  const content = (
    <Badge variant={variant} className={`flex items-center gap-1 ${className ?? ""}`}>
      <Sparkles className="h-3 w-3" />
      {label}
    </Badge>
  );

  // Если есть объяснение или причины, показываем в тултипе
  if (explanation || (reasons && reasons.length > 0)) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="space-y-2">
              {explanation && (
                <p className="text-xs font-semibold">{explanation}</p>
              )}
              {reasons && reasons.length > 0 && (
                <ul className="list-disc list-inside space-y-1">
                  {reasons.map((reason) => (
                    <li key={reason} className="text-xs">
                      {reason}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-muted-foreground">
                Приоритет: {priorityScore}/100
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
