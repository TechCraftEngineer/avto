import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui";
import { IconInbox, IconTrendingUp } from "@tabler/icons-react";
import { SOURCE_CONFIG } from "./utils/source-config";

interface ResponseStatsCardProps {
  responseStats: Record<string, number>;
  totalResponses: number;
}

export function ResponseStatsCard({
  responseStats,
  totalResponses,
}: ResponseStatsCardProps) {
  const hasStats = Object.keys(responseStats).length > 0;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <IconTrendingUp className="size-4 text-muted-foreground" />
            Статистика
          </CardTitle>
          {hasStats && (
            <Badge variant="outline" className="font-semibold tabular-nums">
              {totalResponses}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasStats ? (
          Object.entries(responseStats).map(([sourceKey, count]) => {
            const config = SOURCE_CONFIG[sourceKey.toUpperCase()] || {
              label: sourceKey,
            };
            return (
              <div
                key={sourceKey}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-muted-foreground">{config.label}</span>
                <span className="font-medium tabular-nums">{count}</span>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6 space-y-2">
            <div className="flex justify-center">
              <div className="bg-primary/10 rounded-full p-3">
                <IconInbox className="size-5 text-primary" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-foreground">Нет данных</p>
              <p className="text-xs text-muted-foreground">
                Статистика появится после получения откликов
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
