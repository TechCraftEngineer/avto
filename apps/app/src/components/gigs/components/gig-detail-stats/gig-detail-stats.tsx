import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Skeleton,
} from "@qbs-autonaim/ui";
import { Eye, MessageSquare, Users } from "lucide-react";
import { memo } from "react";

const GigStats = memo(function GigStats({
  views,
  responseCounts,
  isCountsPending,
  isCountsError,
}: {
  views: number;
  responseCounts?: { total: number; new: number } | null;
  isCountsPending: boolean;
  isCountsError: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          Статистика
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" aria-hidden="true" />
              Просмотры
            </div>
            <div className="text-2xl font-bold tabular-nums">{views || 0}</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              Отклики
            </div>
            {isCountsPending ? (
              <Skeleton className="h-8 w-12" />
            ) : isCountsError ? (
              <div className="text-2xl font-bold text-muted-foreground">—</div>
            ) : (
              <div className="text-2xl font-bold tabular-nums">
                {responseCounts?.total || 0}
              </div>
            )}
          </div>
        </div>

        {!isCountsPending &&
          !isCountsError &&
          (responseCounts?.new || 0) > 0 && (
            <>
              <Separator />
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                  Новые отклики
                </div>
                <Badge
                  variant="default"
                  className="bg-primary text-primary-foreground"
                >
                  {responseCounts?.new}
                </Badge>
              </div>
            </>
          )}
      </CardContent>
    </Card>
  );
});

export { GigStats };
