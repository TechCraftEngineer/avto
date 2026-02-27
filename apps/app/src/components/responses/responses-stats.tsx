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
        {["skeleton-0", "skeleton-1", "skeleton-2", "skeleton-3"].map((key) => (
          <Card key={key} size="sm" className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card size="sm" className="border-border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Всего откликов
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tabular-nums">
            {totalResponses}
          </p>
        </CardContent>
      </Card>

      <Card size="sm" className="border-border bg-card shadow-sm">
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

      <Card size="sm" className="border-border bg-card shadow-sm">
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

      <Card size="sm" className="border-border bg-card shadow-sm">
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
