"use client";

import { Badge } from "@qbs-autonaim/ui/components/badge";
import { Separator } from "@qbs-autonaim/ui/components/separator";
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Clock,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import type { GigResponseDetail } from "~/components/responses/types";
import { formatCurrency } from "../../../utils/constants";

interface GigProposalTabProps {
  response: GigResponseDetail;
}

/**
 * Анализ качества отклика gig
 * Проверяет полноту и информативность сопроводительного письма
 */
function analyzeResponseQuality(response: GigResponseDetail): {
  score: number;
  issues: string[];
  suggestions: string[];
  completed: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  const completed: string[] = [];
  let score = 0;

  // Проверка наличия цены
  if (response.proposedPrice && response.proposedPrice > 0) {
    score += 20;
    completed.push("Указана стоимость работы");
  } else {
    issues.push("Не указана стоимость работы");
    suggestions.push("Добавьте предложенную цену");
  }

  // Проверка сроков
  if (response.proposedDeliveryDays && response.proposedDeliveryDays > 0) {
    score += 20;
    completed.push("Указан срок выполнения");
  } else {
    issues.push("Не указан срок выполнения");
    suggestions.push("Добавьте планируемые сроки");
  }

  // Проверка сопроводительного письма
  if (response.coverLetter) {
    const letterLength = response.coverLetter.length;

    // Базовая оценка за наличие письма
    score += 10;

    // Проверка длины
    if (letterLength >= 100) {
      score += 15;
      completed.push("Содержательное сопроводительное письмо");
    } else {
      issues.push("Слишком короткое письмо");
      suggestions.push("Расширьте описание своего предложения");
    }

    // Проверка наличия ключевых слов (опыт, навыки)
    const hasExperience = /\d+\s*(лет|год|месяц)/i.test(response.coverLetter);
    const hasSkills =
      /Python|HTML|CSS|JavaScript|React|Figma|SQL|TABLEAU|Kubernetes/i.test(
        response.coverLetter,
      );
    const hasPortfolio = /портфолио|кейс|проект|работа/i.test(
      response.coverLetter,
    );

    if (hasExperience) {
      score += 10;
      completed.push("Указан опыт работы");
    } else {
      suggestions.push("Добавьте информацию об опыте");
    }

    if (hasSkills) {
      score += 10;
      completed.push("Указаны навыки");
    }

    if (hasPortfolio) {
      score += 10;
      completed.push("Есть упоминание портфолио");
    } else {
      suggestions.push("Добавьте ссылку на портфолио");
    }

    // Проверка CTA (призыв к действию)
    const hasCTA = /свяжитесь|обсудить|жду|готов|звоните|пишите/i.test(
      response.coverLetter,
    );
    if (hasCTA) {
      score += 5;
      completed.push("Есть призыв к действию");
    } else {
      suggestions.push(
        'Добавьте призыв к действию (например: "Свяжитесь со мной для обсуждения")',
      );
    }
  } else {
    issues.push("Отсутствует сопроводительное письмо");
    suggestions.push("Напишите сопроводительное письмо");
  }

  return { score, issues, suggestions, completed };
}

function QualityBadge({ score }: { score: number }) {
  let variant: "default" | "secondary" | "destructive" | "outline" =
    "secondary";
  let label = "Низкое качество";
  let Icon = AlertCircle;

  if (score >= 70) {
    variant = "default";
    label = "Высокое качество";
    Icon = BadgeCheck;
  } else if (score >= 40) {
    variant = "secondary";
    label = "Среднее качество";
    Icon = HelpCircle;
  } else {
    variant = "destructive";
    label = "Низкое качество";
    Icon = AlertCircle;
  }

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label} ({score}%)
    </Badge>
  );
}

export function GigProposalTab({ response }: GigProposalTabProps) {
  const quality = analyzeResponseQuality(response);

  return (
    <div className="space-y-3 sm:space-y-4 mt-0">
      {/* Индикатор качества отклика */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs sm:text-sm font-medium">Оценка отклика</div>
        <QualityBadge score={quality.score} />
      </div>

      {/* Карточки с основной информацией */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
        <div
          className={`rounded-lg border p-3 sm:p-4 ${
            response.proposedPrice
              ? "bg-muted/20 border-border"
              : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
          }`}
        >
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            {response.proposedPrice ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            Предложенная цена
          </div>
          <div className="mt-1 text-base sm:text-lg font-semibold">
            {response.proposedPrice
              ? formatCurrency(response.proposedPrice)
              : "Не указана"}
          </div>
        </div>

        <div
          className={`rounded-lg border p-3 sm:p-4 ${
            response.proposedDeliveryDays
              ? "bg-muted/20 border-border"
              : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
          }`}
        >
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            {response.proposedDeliveryDays ? (
              <Clock className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            Срок выполнения
          </div>
          <div className="mt-1 text-base sm:text-lg font-semibold">
            {response.proposedDeliveryDays
              ? `${response.proposedDeliveryDays} ${response.proposedDeliveryDays === 1 ? "день" : response.proposedDeliveryDays < 5 ? "дня" : "дней"}`
              : "Не указан"}
          </div>
        </div>
      </div>

      {/* Рекомендации по улучшению */}
      {quality.suggestions.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-3 sm:p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
            <TrendingUp className="h-4 w-4" />
            Рекомендации по улучшению отклика
          </div>
          <ul className="space-y-1">
            {quality.suggestions.map((suggestion) => (
              <li
                key={`suggestion-${suggestion.slice(0, 20)}`}
                className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2"
              >
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Выполненные элементы */}
      {quality.completed.length > 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 p-3 sm:p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-200 mb-2">
            <BadgeCheck className="h-4 w-4" />
            Выполнено
          </div>
          <ul className="space-y-1">
            {quality.completed.map((item) => (
              <li
                key={`completed-${item.slice(0, 20)}`}
                className="text-xs sm:text-sm text-green-700 dark:text-green-300 flex items-start gap-2"
              >
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Separator />

      {/* Сопроводительное письмо */}
      {response.coverLetter && (
        <div className="space-y-2">
          <h4 className="text-xs sm:text-sm font-semibold">
            Сопроводительное письмо
          </h4>
          <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed break-words">
            {response.coverLetter}
          </p>
        </div>
      )}

      {!response.coverLetter && (
        <div className="rounded-lg border border-dashed bg-muted/20 text-center py-8 text-muted-foreground">
          <p className="text-xs sm:text-sm">
            Фрилансер не оставил сопроводительного письма
          </p>
        </div>
      )}
    </div>
  );
}
