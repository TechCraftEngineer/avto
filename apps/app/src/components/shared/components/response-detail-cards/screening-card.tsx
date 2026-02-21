import { Badge } from "@qbs-autonaim/ui/components/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qbs-autonaim/ui/components/card";
import { Award } from "lucide-react";
import { SafeHtml } from "~/components";
import { getScoreBadgeVariant } from "../../utils";

interface ScreeningCardProps {
  screening: {
    score?: number;
    detailedScore?: number;
    analysis?: string;
  } | null;
}

export function ScreeningCard({ screening }: ScreeningCardProps) {
  if (!screening?.analysis) return null;

  return (
    <Card className="border-2 shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <Award className="h-6 w-6 text-primary" />
              Скрининг резюме
            </CardTitle>
            {screening.score && (
              <CardDescription className="text-base">
                Оценка: {screening.score}
              </CardDescription>
            )}
          </div>
          {screening.detailedScore !== undefined && (
            <Badge
              variant={getScoreBadgeVariant(screening.detailedScore)}
              className="text-base px-3 py-1 tabular-nums"
            >
              {Math.round(screening.detailedScore)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <SafeHtml
          html={screening.analysis}
          className="prose prose-sm sm:prose-base max-w-none dark:prose-invert [&_span]:inline-block [&_span]:my-1"
        />
      </CardContent>
    </Card>
  );
}
