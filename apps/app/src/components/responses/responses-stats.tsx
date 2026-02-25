import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@qbs-autonaim/ui/components/card";
import { Skeleton } from "@qbs-autonaim/ui/components/skeleton";
import { CheckCircle, FileText, Inbox, Sparkles } from "lucide-react";

interface ResponsesStatsProps {
  totalResponses: number;
  evaluatedResponses: number;
  highScoreResponses: number;
  interviewResponses: number;
  isLoading?: boolean;
}

export function ResponsesStats({
  totalResponses,
  evaluatedResponses,
  highScoreResponses,
  interviewResponses,
  isLoading = false,
}: ResponsesStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton items
          <Card key={`skeleton-${i}`} size="sm">
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16 mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card size="sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Всего откликов
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tabular-nums">{totalResponses}</p>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
            Оценено
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tabular-nums">
            {evaluatedResponses}
          </p>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            Высокий балл
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tabular-nums">
            {highScoreResponses}
          </p>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-muted-foreground" />
            Интервью
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tabular-nums">
            {interviewResponses}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
