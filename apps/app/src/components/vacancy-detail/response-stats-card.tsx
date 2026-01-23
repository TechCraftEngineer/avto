import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui";
import { IconTrendingUp } from "@tabler/icons-react";
import { SOURCE_CONFIG } from "./utils/source-config";

interface ResponseStatsCardProps {
  responseStats: Record<string, number>;
  totalResponses: number;
}

export function ResponseStatsCard({
  responseStats,
  totalResponses,
}: ResponseStatsCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <IconTrendingUp className="size-4 text-muted-foreground" />
            Статистика
          </CardTitle>
          <Badge variant="outline" className="font-semibold tabular-nums">
            {totalResponses}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(responseStats).map(([sourceKey, count]) => {
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
        })}
        {Object.keys(responseStats).length === 0 && (
          <div className="text-center py-2 text-xs text-muted-foreground">
            Нет откликов
          </div>
        )}
      </CardContent>
    </Card>
  );
}
