"use client";

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  Progress,
} from "@qbs-autonaim/ui";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle,
  FileText,
  Lightbulb,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { memo } from "react";
import type {
  VacancyAnalytics,
  VacancyIssue,
  VacancyRecommendation,
} from "~/hooks/use-recruiter-agent";

interface VacancyAnalyticsPanelProps {
  analytics: VacancyAnalytics;
  onApplyRecommendation?: (recommendation: VacancyRecommendation) => void;
  className?: string;
}

/**
 * Компонент панели аналитики вакансии
 *
 * Показывает:
 * - metrics, issues, recommendations
 * - Визуализацию market comparison
 *
 * Requirements: 3.2, 3.4
 */
export const VacancyAnalyticsPanel = memo(function VacancyAnalyticsPanel({
  analytics,
  onApplyRecommendation,
  className,
}: VacancyAnalyticsPanelProps) {
  const { metrics, marketComparison, issues, recommendations } = analytics;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Основные метрики */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Всего откликов"
          value={metrics.totalResponses}
          icon={<Users className="size-4" />}
          trend={
            metrics.totalResponses > 10
              ? { direction: "up", label: "Хорошо" }
              : { direction: "down", label: "Мало" }
          }
        />
        <MetricCard
          title="Обработано"
          value={metrics.processedResponses}
          suffix={`/ ${metrics.totalResponses}`}
          icon={<CheckCircle className="size-4" />}
        />
        <MetricCard
          title="Высокий скор"
          value={metrics.highScoreResponses}
          icon={<TrendingUp className="size-4" />}
          trend={
            metrics.highScoreResponses > 0
              ? { direction: "up", label: "Есть кандидаты" }
              : undefined
          }
        />
        <MetricCard
          title="Средний скор"
          value={`${metrics.avgScore}%`}
          icon={<BarChart3 className="size-4" />}
          trend={
            metrics.avgScore >= 60
              ? { direction: "up", label: "Хорошо" }
              : { direction: "down", label: "Низкий" }
          }
        />
      </div>

      {/* Сравнение с рынком */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            Сравнение с рынком
          </CardTitle>
          <CardDescription>
            Как ваша вакансия выглядит на фоне конкурентов
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <MarketComparisonItem
              label="Зарплата относительно рынка"
              value={marketComparison.salaryPercentile}
              suffix="перцентиль"
              description={getSalaryDescription(
                marketComparison.salaryPercentile,
              )}
              icon={null}
            />
            <MarketComparisonItem
              label="Сложность требований"
              value={marketComparison.requirementsComplexity}
              suffix="/ 100"
              description={getComplexityDescription(
                marketComparison.requirementsComplexity,
              )}
              icon={<FileText className="size-4" />}
            />
            <MarketComparisonItem
              label="Конкурирующих вакансий"
              value={marketComparison.competitorVacancies}
              description={getCompetitionDescription(
                marketComparison.competitorVacancies,
              )}
              icon={<Users className="size-4" />}
            />
            <MarketComparisonItem
              label="Средняя зарплата на рынке"
              value={formatSalary(marketComparison.avgMarketSalary)}
              icon={<TrendingUp className="size-4" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Проблемы */}
      {issues.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-yellow-500" />
              Выявленные проблемы
              <Badge variant="secondary" className="ml-auto">
                {issues.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {issues.map((issue, index) => (
                <IssueItem key={`${issue.type}-${index}`} issue={issue} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Рекомендации */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="size-4 text-primary" />
              Рекомендации
              <Badge variant="secondary" className="ml-auto">
                {recommendations.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations
                .sort((a, b) => b.priority - a.priority)
                .map((rec, index) => (
                  <RecommendationItem
                    key={`${rec.type}-${index}`}
                    recommendation={rec}
                    onApply={onApplyRecommendation}
                  />
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Если нет проблем и рекомендаций */}
      {issues.length === 0 && recommendations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="mb-3 size-12 text-green-500" />
            <h3 className="mb-1 font-semibold">Всё отлично!</h3>
            <p className="text-muted-foreground text-sm">
              Вакансия хорошо оптимизирована, проблем не обнаружено.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

interface MetricCardProps {
  title: string;
  value: string | number;
  suffix?: string;
  icon: React.ReactNode;
  trend?: {
    direction: "up" | "down";
    label: string;
  };
}

function MetricCard({ title, value, suffix, icon, trend }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">{title}</span>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span
            className="font-bold text-2xl"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {value}
          </span>
          {suffix && (
            <span className="text-muted-foreground text-sm">{suffix}</span>
          )}
        </div>
        {trend && (
          <div
            className={cn(
              "mt-1 flex items-center gap-1 text-xs",
              trend.direction === "up" ? "text-green-600" : "text-red-600",
            )}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            <span>{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MarketComparisonItemProps {
  label: string;
  value: string | number;
  suffix?: string;
  description?: string;
  icon: React.ReactNode;
}

function MarketComparisonItem({
  label,
  value,
  suffix,
  description,
  icon,
}: MarketComparisonItemProps) {
  const numericValue = typeof value === "number" ? value : 50;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{icon}</span>
          <span>{label}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className="font-semibold"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {value}
          </span>
          {suffix && (
            <span className="text-muted-foreground text-xs">{suffix}</span>
          )}
        </div>
      </div>
      {typeof value === "number" && (
        <Progress value={Math.min(100, numericValue)} className="h-1.5" />
      )}
      {description && (
        <p className="text-muted-foreground text-xs">{description}</p>
      )}
    </div>
  );
}

interface IssueItemProps {
  issue: VacancyIssue;
}

function IssueItem({ issue }: IssueItemProps) {
  const severityConfig = {
    low: {
      badge:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      border: "border-l-yellow-500",
    },
    medium: {
      badge:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      border: "border-l-orange-500",
    },
    high: {
      badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      border: "border-l-red-500",
    },
  };

  const config = severityConfig[issue.severity];

  const typeLabels: Record<VacancyIssue["type"], string> = {
    salary: "Зарплата",
    requirements: "Требования",
    description: "Описание",
    timing: "Время",
    competition: "Конкуренция",
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-l-4 bg-muted/30 p-3",
        config.border,
      )}
    >
      <div className="mb-1 flex items-center gap-2">
        <Badge variant="secondary" className={config.badge}>
          {typeLabels[issue.type]}
        </Badge>
        <span className="font-medium text-sm">{issue.title}</span>
      </div>
      <p className="mb-1 text-muted-foreground text-sm">{issue.description}</p>
      <p className="text-muted-foreground text-xs">
        <span className="font-medium">Влияние:</span> {issue.impact}
      </p>
    </div>
  );
}

interface RecommendationItemProps {
  recommendation: VacancyRecommendation;
  onApply?: (recommendation: VacancyRecommendation) => void;
}

function RecommendationItem({
  recommendation,
  onApply,
}: RecommendationItemProps) {
  const typeLabels: Record<VacancyRecommendation["type"], string> = {
    change_title: "Заголовок",
    adjust_salary: "Зарплата",
    simplify_requirements: "Требования",
    improve_description: "Описание",
  };

  const priorityConfig = {
    high: "border-l-green-500",
    medium: "border-l-blue-500",
    low: "border-l-gray-400",
  };

  const getPriorityLevel = (priority: number): "high" | "medium" | "low" => {
    if (priority >= 8) return "high";
    if (priority >= 5) return "medium";
    return "low";
  };

  const priorityLevel = getPriorityLevel(recommendation.priority);

  return (
    <div
      className={cn(
        "rounded-lg border border-l-4 bg-muted/30 p-3",
        priorityConfig[priorityLevel],
      )}
    >
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{typeLabels[recommendation.type]}</Badge>
          <span className="font-medium text-sm">{recommendation.title}</span>
        </div>
        {onApply && (
          <button
            type="button"
            onClick={() => onApply(recommendation)}
            className="flex items-center gap-1 text-primary text-xs hover:underline"
          >
            Применить
            <ArrowRight className="size-3" />
          </button>
        )}
      </div>
      <p className="mb-1 text-muted-foreground text-sm">
        {recommendation.description}
      </p>
      <p className="text-muted-foreground text-xs">
        <span className="font-medium">Ожидаемый эффект:</span>{" "}
        {recommendation.expectedImpact}
      </p>
    </div>
  );
}

// Вспомогательные функции
function getSalaryDescription(percentile: number): string {
  if (percentile >= 75) return "Выше рынка — привлекательно для кандидатов";
  if (percentile >= 50) return "На уровне рынка";
  if (percentile >= 25) return "Ниже рынка — может отпугивать кандидатов";
  return "Значительно ниже рынка";
}

function getComplexityDescription(complexity: number): string {
  if (complexity >= 80) return "Очень высокие требования — сужает воронку";
  if (complexity >= 60) return "Высокие требования";
  if (complexity >= 40) return "Умеренные требования";
  return "Низкие требования — широкая воронка";
}

function getCompetitionDescription(count: number): string {
  if (count >= 50) return "Высокая конкуренция за кандидатов";
  if (count >= 20) return "Умеренная конкуренция";
  if (count >= 5) return "Низкая конкуренция";
  return "Минимальная конкуренция";
}

function formatSalary(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M ₽`;
  }
  if (amount >= 1000) {
    return `${Math.round(amount / 1000)}K ₽`;
  }
  return `${amount} ₽`;
}
