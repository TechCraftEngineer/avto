import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
} from "@qbs-autonaim/ui";
import { IconChartBar, IconInbox, IconTrendingUp } from "@tabler/icons-react";
import { SOURCE_CONFIG } from "./utils/source-config";

interface ResponseStatsCardProps {
  responseStats: Record<string, number>;
  totalResponses: number;
}

/**
 * Статистика откликов по площадкам
 * Показывает распределение откликов и помогает понять эффективность каждой площадки
 */
export function ResponseStatsCard({
  responseStats,
  totalResponses,
}: ResponseStatsCardProps) {
  const hasStats = Object.keys(responseStats).length > 0;

  // Сортируем площадки по количеству откликов
  const sortedStats = Object.entries(responseStats).sort(
    ([, a], [, b]) => b - a,
  );

  // Находим площадку с максимальным количеством откликов
  const maxResponses = Math.max(...Object.values(responseStats), 1);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <IconChartBar className="size-4 text-primary" />
            Отклики по площадкам
          </CardTitle>
          {hasStats && (
            <Badge
              variant="secondary"
              className="font-bold tabular-nums text-base px-3 py-1"
            >
              {totalResponses}
            </Badge>
          )}
        </div>
        {hasStats && (
          <p className="text-xs text-muted-foreground mt-1">
            Всего получено откликов
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {hasStats ? (
          <>
            {sortedStats.map(([sourceKey, count], index) => {
              const config = SOURCE_CONFIG[sourceKey.toUpperCase()] || {
                label: sourceKey,
              };
              const percentage = Math.round((count / totalResponses) * 100);
              const progressValue = (count / maxResponses) * 100;

              return (
                <div key={sourceKey} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {index === 0 && count > 0 && (
                        <IconTrendingUp className="size-3.5 text-green-600" />
                      )}
                      <span className="font-medium text-foreground">
                        {config.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">
                        {percentage}%
                      </span>
                      <span className="font-bold tabular-nums text-foreground">
                        {count}
                      </span>
                    </div>
                  </div>
                  <Progress value={progressValue} className="h-2" />
                </div>
              );
            })}

            {/* Подсказка для рекрутера */}
            {sortedStats.length > 1 && (
              <div className="pt-2 mt-2 border-t">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">Совет:</span>{" "}
                  {sortedStats[0][0] === "KWORK" ||
                  sortedStats[0][0] === "FL_RU"
                    ? "Фриланс-площадки дают больше откликов. Рассмотрите увеличение бюджета на этих платформах."
                    : "Сосредоточьтесь на площадках с наибольшим количеством откликов для лучших результатов."}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 space-y-3">
            <div className="flex justify-center">
              <div className="bg-primary/10 rounded-full p-4">
                <IconInbox className="size-6 text-primary" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Пока нет откликов
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px] mx-auto">
                Статистика появится после получения первых откликов от
                кандидатов
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
