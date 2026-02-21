"use client";

import { Alert, AlertDescription, AlertTitle } from "@qbs-autonaim/ui/components/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@qbs-autonaim/ui/components/card";
import {
  IconAlertTriangle,
  IconBulb,
  IconChartLine,
  IconTrendingUp,
} from "@tabler/icons-react";

interface VacancyInsightsCardProps {
  totalResponses: number;
  daysActive: number;
  isActive: boolean;
  hasPublications: boolean;
}

interface Insight {
  type: "success" | "warning" | "info" | "error";
  title: string;
  message: string;
  icon: typeof IconBulb;
}

/**
 * Карточка с аналитикой и рекомендациями для рекрутера
 * Анализирует эффективность вакансии и даёт практические советы
 */
export function VacancyInsightsCard({
  totalResponses: initialTotalResponses,
  daysActive,
  isActive: initialIsActive,
  hasPublications,
}: VacancyInsightsCardProps) {
  const totalResponses = initialTotalResponses;
  const isActive = initialIsActive;

  const insights: Insight[] = [];
  const responsesPerDay = daysActive > 0 ? totalResponses / daysActive : 0;

  // Анализ: хорошая активность откликов
  if (responsesPerDay >= 2 && daysActive >= 3) {
    insights.push({
      type: "success",
      title: "Стабильный поток откликов",
      message: `В среднем ${responsesPerDay.toFixed(1)} откликов в день. Вакансия привлекает внимание кандидатов.`,
      icon: IconChartLine,
    });
  }

  // Анализ: низкая активность при длительной публикации
  if (daysActive >= 7 && totalResponses < 3) {
    insights.push({
      type: "warning",
      title: "Мало откликов за неделю",
      message:
        "Вакансия опубликована более недели, но откликов мало. Попробуйте расширить географию поиска или пересмотреть требования.",
      icon: IconAlertTriangle,
    });
  }

  // Анализ: нет публикаций
  if (!hasPublications && isActive) {
    insights.push({
      type: "warning",
      title: "Вакансия не опубликована",
      message:
        "Вакансия активна, но не опубликована ни на одной площадке. Добавьте публикации для привлечения кандидатов.",
      icon: IconAlertTriangle,
    });
  }

  // Анализ: новая вакансия без активности
  if (daysActive <= 2 && totalResponses === 0 && isActive) {
    insights.push({
      type: "info",
      title: "Вакансия только создана",
      message:
        "Дайте время на индексацию и продвижение. Обычно первые отклики появляются через 1-3 дня после публикации.",
      icon: IconBulb,
    });
  }

  // Анализ: отличные показатели
  if (totalResponses >= 10 && responsesPerDay >= 1.5) {
    insights.push({
      type: "success",
      title: "Превосходные результаты!",
      message:
        "Вакансия показывает отличные результаты по всем метрикам. Используйте этот опыт для других вакансий.",
      icon: IconTrendingUp,
    });
  }

  if (insights.length === 0) {
    return null;
  }

  const getAlertVariant = (
    type: Insight["type"],
  ): "default" | "destructive" => {
    return type === "error" ? "destructive" : "default";
  };

  const getAlertColor = (type: Insight["type"]) => {
    switch (type) {
      case "success":
        return "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100";
      case "warning":
        return "border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-100";
      case "info":
        return "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100";
      case "error":
        return "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100";
      default:
        return "";
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <IconBulb className="size-4 text-primary" />
          Аналитика и рекомендации
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Умные подсказки для улучшения результатов
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <Alert
              key={`${insight.type}-${index}`}
              variant={getAlertVariant(insight.type)}
              className={getAlertColor(insight.type)}
            >
              <Icon className="size-4" />
              <AlertTitle className="font-semibold text-sm">
                {insight.title}
              </AlertTitle>
              <AlertDescription className="text-xs leading-relaxed mt-1">
                {insight.message}
              </AlertDescription>
            </Alert>
          );
        })}
      </CardContent>
    </Card>
  );
}
