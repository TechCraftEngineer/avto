"use client";

import { Alert, AlertDescription, AlertTitle } from "@qbs-autonaim/ui/alert";
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconBulb,
  IconTrendingUp,
} from "@tabler/icons-react";

interface VacancyInsight {
  type: "success" | "warning" | "info" | "error";
  title: string;
  message: string;
  icon: typeof IconBulb;
}

interface VacancyInsightsProps {
  totalVacancies: number;
  activeVacancies: number;
  totalResponses: number;
  newResponses: number;
  avgResponsesPerVacancy: number;
}

/**
 * Компонент с умными подсказками для рекрутеров
 * Анализирует данные и даёт рекомендации по улучшению работы
 */
export function VacancyInsights({
  totalVacancies,
  activeVacancies,
  totalResponses,
  newResponses,
  avgResponsesPerVacancy,
}: VacancyInsightsProps) {
  const insights: VacancyInsight[] = [];

  // Анализ: много новых откликов
  if (newResponses > 10) {
    insights.push({
      type: "warning",
      title: "Требуется внимание",
      message: `У вас ${newResponses} новых откликов. Рекомендуем обработать их в течение 24 часов для лучшей конверсии.`,
      icon: IconAlertTriangle,
    });
  }

  // Анализ: низкая активность откликов
  if (activeVacancies > 0 && avgResponsesPerVacancy < 2) {
    insights.push({
      type: "info",
      title: "Низкая активность",
      message:
        "Среднее количество откликов на вакансию ниже нормы. Попробуйте улучшить описание или условия.",
      icon: IconBulb,
    });
  }

  // Анализ: отличная активность
  if (avgResponsesPerVacancy >= 10) {
    insights.push({
      type: "success",
      title: "Отличная работа!",
      message: `В среднем ${avgResponsesPerVacancy} откликов на вакансию — это отличный результат. Продолжайте в том же духе!`,
      icon: IconTrendingUp,
    });
  }

  // Анализ: нет активных вакансий
  if (totalVacancies > 0 && activeVacancies === 0) {
    insights.push({
      type: "info",
      title: "Нет активных вакансий",
      message:
        "Все ваши вакансии закрыты. Создайте новые или активируйте существующие для продолжения поиска.",
      icon: IconAlertCircle,
    });
  }

  // Анализ: нет откликов вообще
  if (activeVacancies > 0 && totalResponses === 0) {
    insights.push({
      type: "warning",
      title: "Нет откликов",
      message:
        "Пока нет ни одного отклика. Проверьте настройки публикации и видимость вакансий на площадках.",
      icon: IconAlertTriangle,
    });
  }

  if (insights.length === 0) {
    return null;
  }

  const getAlertVariant = (
    type: VacancyInsight["type"],
  ): "default" | "destructive" => {
    return type === "error" ? "destructive" : "default";
  };

  const getAlertColor = (type: VacancyInsight["type"]) => {
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
    <div className="space-y-3">
      {insights.map((insight, index) => {
        const Icon = insight.icon;
        return (
          <Alert
            key={`${insight.type}-${index}`}
            variant={getAlertVariant(insight.type)}
            className={getAlertColor(insight.type)}
          >
            <Icon className="size-4" />
            <AlertTitle className="font-semibold">{insight.title}</AlertTitle>
            <AlertDescription className="text-sm">
              {insight.message}
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}

