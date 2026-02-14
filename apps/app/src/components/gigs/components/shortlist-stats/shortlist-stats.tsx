import { Card, CardContent, CardHeader, CardTitle } from "@qbs-autonaim/ui";

interface ShortlistStatsProps {
  candidatesCount: number;
  totalCandidates: number;
  highlyRecommendedCount: number;
  averageScore: number;
}

export function ShortlistStats({
  candidatesCount,
  totalCandidates,
  highlyRecommendedCount,
  averageScore,
}: ShortlistStatsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Статистика шортлиста</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Кандидатов в шортлисте
            </p>
            <p className="text-2xl font-bold">{candidatesCount}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Всего ранжированных</p>
            <p className="text-2xl font-bold text-muted-foreground">
              {totalCandidates}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Настоятельно рекомендованы
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {highlyRecommendedCount}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Средняя оценка</p>
            <p className="text-2xl font-bold">{averageScore}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
