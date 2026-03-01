"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@qbs-autonaim/ui/components/tooltip";
import { cn } from "@qbs-autonaim/ui/utils";
import { ChevronRight, PenLine } from "lucide-react";
import React from "react";

const TRUNCATE_THRESHOLD = 35;

/** Quiz-шаг: вопрос + варианты для выбора + поле для своего варианта */

interface QuizStepBlockProps {
  question: string;
  options: string[];
  onSelectOption: (value: string) => void;
  onCustomAnswer: (value: string) => void;
  disabled?: boolean;
  inputPlaceholder?: string;
  /** Скрыть вопрос (уже показан выше как ChatMessage) */
  hideQuestion?: boolean;
}

export function QuizStepBlock({
  question,
  options,
  onSelectOption,
  onCustomAnswer,
  disabled = false,
  inputPlaceholder = "Или напишите свой вариант…",
  hideQuestion = false,
}: QuizStepBlockProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [customValue, setCustomValue] = React.useState("");

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customValue.trim();
    if (!trimmed || disabled) return;
    onCustomAnswer(trimmed);
    setCustomValue("");
  };

  return (
    <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
      {!hideQuestion && question && (
        <p className="text-sm font-medium leading-snug text-foreground">
          {question}
        </p>
      )}

      {/* Варианты для выбора — карточки */}
      {options.length > 0 && (
        <TooltipProvider>
          <div className="grid gap-2 sm:grid-cols-2">
            {options.map((option) => {
              const needsTooltip = option.length > TRUNCATE_THRESHOLD;
              const button = (
                <button
                  key={option}
                  type="button"
                  onClick={() => onSelectOption(option)}
                  disabled={disabled}
                  className={cn(
                    "group flex items-center justify-between gap-2 rounded-lg border bg-background px-4 py-3 text-left text-sm transition-all",
                    "hover:border-primary hover:bg-primary/5 hover:shadow-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    "disabled:pointer-events-none disabled:opacity-60",
                  )}
                  style={{ touchAction: "manipulation" }}
                >
                  <span className="flex-1 truncate">{option}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              );
              return needsTooltip ? (
                <Tooltip key={option}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-[min(20rem,90vw)]"
                  >
                    {option}
                  </TooltipContent>
                </Tooltip>
              ) : (
                button
              );
            })}
          </div>
        </TooltipProvider>
      )}

      {/* Свой вариант */}
      <form
        onSubmit={handleCustomSubmit}
        className="flex gap-2 rounded-lg border border-dashed border-muted-foreground/30 bg-background/50 p-2"
      >
        <div className="flex flex-1 items-center gap-2">
          <PenLine className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder={inputPlaceholder}
            disabled={disabled}
            className="flex-1 min-w-0 bg-transparent text-base placeholder:text-muted-foreground focus:outline-none"
            autoComplete="off"
          />
        </div>
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          disabled={!customValue.trim() || disabled}
          className="shrink-0"
        >
          Отправить
        </Button>
      </form>
    </div>
  );
}
