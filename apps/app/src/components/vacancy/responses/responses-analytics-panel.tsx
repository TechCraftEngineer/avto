import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui";
import {
  IconAlertCircle,
  IconBulb,
  IconCheck,
  IconClock,
  IconStar,
  IconTrendingUp,
  IconUsers,
} from "@tabler/icons-react";

interface ResponsesAnalyticsPanelProps {
  totalResponses: number;
  newResponses: number;
  topCandidates: number;
  inProgress: number;
  accepted: number;
  averageScore: number;
  conversionRate: number;
}

/**
 * Панель аналитики откликов
 * Показывает ключевые метрики и умные рекомендации для рекрутера
 */
export function ResponsesAnalyticsPanel({
  totalResponses,
  newResponses,
  topCandidates,
  inProgress,
  accepted,
  averageScore,
  conversionRate,
}: ResponsesAnalyticsPanelProps) {
  // Генерируем умные подсказки
  const insights = [];

  if (topCandidates > 0) {
    insights.push({
      type: "success" as const,
      icon: IconStar,
      message: `У вас ${topCandidates} ${topCandidates === 1 ? "кандидат" : topCandidates < 5 ? "кандидата" : "кандидатов"} с высоким приоритетом — начните с ${topCandidates === 1 ? "него" : "них"}`,
    });
  }

  if (newResponses > 10) {
    insights.push({
      type: "warning" as const,
      icon: IconAlertCircle,
      message: `${newResponses} ${newResponses === 1 ? "новый отклик ждёт" : newResponses < 5 ? "новых отклика ждут" : "новых откликов ждут"} первичной оценки`,
    });
  } else if (newResponses > 0) {
    insights.push({
      type: "info" as const,
      icon: IconClock,
      message: `${newResponses} ${newResponses === 1 ? "новый отклик" : newResponses < 5 ? "новых отклика" : "новых откликов"} — рекомендуем обработать в течение 24 часов`,
    });
  }

  if (averageScore >= 7) {
    insights.push({
      type: "success" as const,
      icon: IconTrendingUp,
      message: `Средний балл откликов ${averageScore.toFixed(1)}/10 — отличный показатель качества`,
    });
  } else if (averageScore < 5 && totalResponses > 10) {
    insights.push({
      type: "warning" as const,
      icon: IconAlertCircle,
      message: `Средний балл откликов ${averageScore.toFixed(1)}/10 — возможно, стоит пересмотреть требования вакансии`,
    });
  }

  if (conversionRate >= 15 && accepted > 5) {
    insights.push({
      type: "success" as const,
      icon: IconCheck,
      message: `Конверсия ${conversionRate.toFixed(1)}% — выше среднего! Отличная работа`,
    });
  }

  const getStatColor = (
    value: number,
    type: "new" | "top" | "progress" | "accepted",
  ) => {
    switch (type) {
      case "new":
        return value > 10
          ? "border-orange-200 bg-orange-50"
          : "border-blue-200 bg-blue-50";
      case "top":
        return "border-green-200 bg-green-50";
      case "progress":
        return "border-yellow-200 bg-yellow-50";
      case "accepted":
        return "border-emerald-200 bg-emerald-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const getStatTextColor = (type: "new" | "top" | "progress" | "accepted") => {
    switch (type) {
      case "new":
        return "text-blue-700";
      case "top":
        return "text-green-700";
      case "progress":
        return "text-yellow-700";
      case "accepted":
        return "text-emerald-700";
      default:
        return "text-gray-700";
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <IconUsers className="size-5 text-primary" />
          Сводка по откликам
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Метрики */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Новые */}
          <div
            className={`rounded-lg border-2 p-4 ${getStatColor(newResponses, "new")}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-blue-100 rounded-full p-1.5">
                <IconClock className="size-4 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-blue-900">Новые</span>
            </div>
            <div className={`text-3xl font-bold ${getStatTextColor("new")}`}>
              {newResponses}
            </div>
            <p className="text-xs text-blue-600 mt-1">Требуют оценки</p>
          </div>

          {/* Топ-кандидаты */}
          <div
            className={`rounded-lg border-2 p-4 ${getStatColor(topCandidates, "top")}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-green-100 rounded-full p-1.5">
                <IconStar className="size-4 text-green-600" />
              </div>
              <span className="text-xs font-semibold text-green-900">Топ</span>
            </div>
            <div className={`text-3xl font-bold ${getStatTextColor("top")}`}>
              {topCandidates}
            </div>
            <p className="text-xs text-green-600 mt-1">Приоритет ≥ 8</p>
          </div>

          {/* В работе */}
          <div
            className={`rounded-lg border-2 p-4 ${getStatColor(inProgress, "progress")}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-yellow-100 rounded-full p-1.5">
                <IconUsers className="size-4 text-yellow-600" />
              </div>
              <span className="text-xs font-semibold text-yellow-900">
                В работе
              </span>
            </div>
            <div
              className={`text-3xl font-bold ${getStatTextColor("progress")}`}
            >
              {inProgress}
            </div>
            <p className="text-xs text-yellow-600 mt-1">Обрабатываются</p>
          </div>

          {/* Приняты */}
          <div
            className={`rounded-lg border-2 p-4 ${getStatColor(accepted, "accepted")}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-emerald-100 rounded-full p-1.5">
                <IconCheck className="size-4 text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-emerald-900">
                Приняты
              </span>
            </div>
            <div
              className={`text-3xl font-bold ${getStatTextColor("accepted")}`}
            >
              {accepted}
            </div>
            <p className="text-xs text-emerald-600 mt-1">
              {conversionRate > 0
                ? `${conversionRate.toFixed(1)}% конверсия`
                : "Успешные"}
            </p>
          </div>
        </div>

        {/* Умные подсказки */}
        {insights.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2 mb-2">
              <IconBulb className="size-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                Рекомендации:
              </span>
            </div>
            {insights.map((insight, index) => {
              const Icon = insight.icon;
              const alertClass =
                insight.type === "success"
                  ? "border-green-200 bg-green-50 text-green-900"
                  : insight.type === "warning"
                    ? "border-orange-200 bg-orange-50 text-orange-900"
                    : "border-blue-200 bg-blue-50 text-blue-900";

              return (
                <Alert key={index} className={`${alertClass} py-2`}>
                  <Icon className="size-4" />
                  <AlertDescription className="text-xs leading-relaxed">
                    {insight.message}
                  </AlertDescription>
                </Alert>
              );
            })}
          </div>
        )}

        {/* Дополнительная статистика */}
        {totalResponses > 0 && (
          <div className="pt-2 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Всего откликов:</span>
                <span className="ml-2 font-semibold text-foreground">
                  {totalResponses}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Средний балл:</span>
                <span className="ml-2 font-semibold text-foreground">
                  {averageScore.toFixed(1)}/10
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
