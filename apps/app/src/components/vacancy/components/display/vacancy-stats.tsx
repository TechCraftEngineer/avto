import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import { Eye, Inbox, Loader } from "lucide-react";

interface VacancyStatsProps {
  responses: number | null;
  newResponses: number | null;
  resumesInProgress: number | null;
}

export function VacancyStats({
  responses,
  newResponses,
  resumesInProgress,
}: VacancyStatsProps) {
  const hasAnyData =
    (responses ?? 0) > 0 ||
    (newResponses ?? 0) > 0 ||
    (resumesInProgress ?? 0) > 0;

  if (!hasAnyData) {
    return (
      <Card className="border-dashed col-span-full">
        <CardHeader className="text-center py-8">
          <div className="flex justify-center mb-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl" />
              <div className="relative bg-linear-to-br from-primary/20 to-primary/5 rounded-full p-4">
                <Eye className="h-8 w-8 text-primary" />
              </div>
            </div>
          </div>
          <CardTitle className="text-lg mb-1">
            Статистика пока недоступна
          </CardTitle>
          <CardDescription className="text-sm">
            Данные об откликах появятся после публикации вакансии на платформе
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs md:grid-cols-3">
      <Card className="@container/card">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <Eye className="h-4 w-4 text-muted-foreground" />
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
