import { Card, CardDescription, CardHeader, CardTitle } from "@qbs-autonaim/ui";
import { Eye, FileText, Inbox, Loader } from "lucide-react";

interface VacancyStatsProps {
  views: number | null;
  responses: number | null;
  newResponses: number | null;
  resumesInProgress: number | null;
}

export function VacancyStats({
  views,
  responses,
  newResponses,
  resumesInProgress,
}: VacancyStatsProps) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs md:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <CardDescription>Просмотров</CardDescription>
          </div>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {views ?? 0}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <CardDescription>Откликов</CardDescription>
          </div>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {responses ?? 0}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <Inbox className="h-4 w-4 text-muted-foreground" />
            <CardDescription>Новых</CardDescription>
          </div>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {newResponses ?? 0}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <Loader className="h-4 w-4 text-muted-foreground" />
            <CardDescription>В работе</CardDescription>
          </div>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {resumesInProgress ?? 0}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
