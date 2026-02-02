import Card from "@qbs-autonaim/ui/Card";
import CardDescription from "@qbs-autonaim/ui/CardDescription";
import CardHeader from "@qbs-autonaim/ui/CardHeader";
import CardTitle from "@qbs-autonaim/ui/CardTitle";
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
          <Card key={`skeleton-${i}`} className="animate-pulse">
            <CardHeader>
              <div className="h-4 w-20 bg-muted rounded mb-2" />
              <div className="h-8 w-16 bg-muted rounded" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <CardDescription>Всего откликов</CardDescription>
          </div>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {totalResponses}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
            <CardDescription>Оценено</CardDescription>
          </div>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {evaluatedResponses}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <CardDescription>Высокий балл</CardDescription>
          </div>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {highScoreResponses}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <Inbox className="h-4 w-4 text-muted-foreground" />
            <CardDescription>Интервью</CardDescription>
          </div>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {interviewResponses}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
