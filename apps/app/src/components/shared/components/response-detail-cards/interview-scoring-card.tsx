"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  Separator,
} from "@qbs-autonaim/ui";
import { MessageSquare } from "lucide-react";
import { SafeHtml } from "~/components";

interface InterviewScoringCardProps {
  interviewScoring: {
    score: number;
    detailedScore?: number;
    analysis: string | null | undefined;
    botUsageDetected?: number | null;
  };
}

export function InterviewScoringCard({
  interviewScoring,
}: InterviewScoringCardProps) {
  const botUsage = interviewScoring.botUsageDetected ?? null;
  const showBotWarning = botUsage !== null && botUsage >= 60;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
          Результаты интервью
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Оценка кандидата на основе AI-интервью
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Score Overview */}
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium">
                Общая оценка
              </span>
              <span className="text-xl sm:text-2xl font-bold tabular-nums">
                {interviewScoring.score}
              </span>
            </div>
            <Progress
              value={((interviewScoring.score ?? 0) / 5) * 100}
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium">
                Детальная оценка
              </span>
              <span className="text-xl sm:text-2xl font-bold tabular-nums">
                {Math.round(interviewScoring.detailedScore ?? 0)}
              </span>
            </div>
            <Progress
              value={interviewScoring.detailedScore ?? 0}
              className="h-2"
            />
          </div>
        </div>

        {/* Bot Usage Detection */}
        {botUsage !== null && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium">
                  Вероятность использования AI-бота
                </span>
                <span
                  className={`text-xl sm:text-2xl font-bold ${
                    botUsage >= 80
                      ? "text-destructive"
                      : botUsage >= 60
                        ? "text-orange-600"
                        : botUsage >= 40
                          ? "text-yellow-600"
                          : "text-green-600"
                  }`}
                >
                  {botUsage}%
                </span>
              </div>
              <Progress
                value={botUsage}
                className={`h-2 ${
                  botUsage >= 80
                    ? "[&>div]:bg-destructive"
                    : botUsage >= 60
                      ? "[&>div]:bg-orange-600"
                      : botUsage >= 40
                        ? "[&>div]:bg-yellow-600"
                        : "[&>div]:bg-green-600"
                }`}
              />
              {showBotWarning && (
                <p className="text-xs text-orange-600 dark:text-orange-500 mt-2">
                  ⚠️ Обнаружены признаки использования AI-бота для ответов
                </p>
              )}
            </div>
          </>
        )}

        <Separator />

        {/* Analysis */}
        {interviewScoring.analysis && (
          <div className="space-y-2">
            <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              Анализ интервью
            </h4>
            <SafeHtml
              html={interviewScoring.analysis}
              className="prose prose-sm max-w-none text-xs sm:text-sm"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
