"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import { Badge } from "@qbs-autonaim/ui/components/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@qbs-autonaim/ui/components/select";
import { cn } from "@qbs-autonaim/ui/utils";
import { User } from "lucide-react";

type ResponseItem =
  RouterOutputs["vacancy"]["responses"]["list"]["responses"][number];

interface InterviewCandidatePickerProps {
  responses: ResponseItem[];
  selectedResponseId: string | null;
  onSelect: (responseId: string | null) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export function InterviewCandidatePicker({
  responses,
  selectedResponseId,
  onSelect,
  isLoading,
  placeholder = "Выберите кандидата",
  className,
}: InterviewCandidatePickerProps) {
  const CLEAR_VALUE = "__clear__";

  return (
    <Select
      value={selectedResponseId ?? ""}
      onValueChange={(v) => onSelect(v === CLEAR_VALUE || !v ? null : v)}
      disabled={isLoading || responses.length === 0}
    >
      <SelectTrigger
        className={cn("w-full min-w-[200px]", className)}
        aria-label="Выбор кандидата для интервью"
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {responses.length > 0 && (
          <SelectItem value={CLEAR_VALUE}>Сбросить выбор</SelectItem>
        )}
        {responses.map((r) => (
          <SelectItem key={r.id} value={r.id}>
            <div className="flex items-center gap-2">
              <User className="size-4 shrink-0 text-muted-foreground" />
              <span>{r.candidateName ?? "Без имени"}</span>
              {r.screening?.overallScore != null && (
                <Badge variant="secondary" className="text-xs">
                  {r.screening.overallScore}/100
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
