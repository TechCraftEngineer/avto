"use client";

import { Badge } from "@qbs-autonaim/ui/components/badge";
import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import { ScrollArea } from "@qbs-autonaim/ui/components/scroll-area";
import { Skeleton } from "@qbs-autonaim/ui/components/skeleton";
import { cn } from "@qbs-autonaim/ui/utils";
import { RefreshCw, Sparkles } from "lucide-react";

interface InterviewQuestion {
  question: string;
  purpose: string;
  relatedRisk: string | null;
}

interface InterviewQuestions {
  questions: InterviewQuestion[];
  explanation: string;
}

const PURPOSE_LABELS: Record<string, string> = {
  risk_clarification: "Уточнение риска",
  skill_verification: "Проверка навыков",
  culture_fit: "Соответствие культуре",
  experience_deepening: "Углубление в опыт",
};

interface InterviewPromptsPanelProps {
  questions: InterviewQuestions | null | undefined;
  isLoading: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  candidateName?: string | null;
  className?: string;
}

export function InterviewPromptsPanel({
  questions,
  isLoading,
  onRefresh,
  isRefreshing,
  candidateName,
  className,
}: InterviewPromptsPanelProps) {
  if (isLoading) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="size-5 text-primary" />
            Подсказки для интервью
          </CardTitle>
          <CardDescription>
            Генерируем вопросы на основе вакансии и резюме кандидата
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!questions?.questions?.length) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="size-5 text-primary" />
            Подсказки для интервью
          </CardTitle>
          <CardDescription>
            Вопросы появятся после выбора кандидата
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed bg-muted/20 py-8 text-center text-sm text-muted-foreground">
            Выберите кандидата, чтобы увидеть персонализированные вопросы для
            интервью
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="size-5 text-primary" />
            Подсказки для интервью
          </CardTitle>
          <CardDescription>
            {candidateName
              ? `Вопросы для ${candidateName} — учитывают резюме, вакансию и скрининг`
              : "Вопросы с учётом резюме и требований вакансии"}
          </CardDescription>
        </div>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Обновить вопросы"
          >
            <RefreshCw
              className={cn("size-4 shrink-0", isRefreshing && "animate-spin")}
            />
            Обновить
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.explanation && (
          <p className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3">
            {questions.explanation}
          </p>
        )}
        <ScrollArea className="h-[300px] pr-4">
          <ol className="space-y-3">
            {questions.questions.map((q, idx) => (
              <li
                key={`${q.purpose}-${q.question}`}
                className="rounded-lg border bg-muted/30 p-3 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-medium text-foreground">
                    {idx + 1}. {q.question}
                  </span>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {PURPOSE_LABELS[q.purpose] ?? q.purpose}
                  </Badge>
                  {q.relatedRisk && (
                    <Badge variant="secondary" className="text-xs">
                      Риск: {q.relatedRisk}
                    </Badge>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
