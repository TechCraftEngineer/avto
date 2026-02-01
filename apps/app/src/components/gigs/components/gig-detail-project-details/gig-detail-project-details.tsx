import { Card, CardContent, CardHeader, CardTitle } from "@qbs-autonaim/ui";
import { Calendar, Target, Timer, Wallet } from "lucide-react";
import { memo } from "react";
import { formatBudget, formatDate } from "./gig-detail-utils";

const ProjectDetails = memo(function ProjectDetails({
  budgetMin,
  budgetMax,
  estimatedDuration,
  deadline,
}: {
  budgetMin?: number | null;
  budgetMax?: number | null;
  estimatedDuration?: string | null;
  deadline?: Date | null;
}) {
  const hasDetails = budgetMin || budgetMax || estimatedDuration || deadline;

  if (!hasDetails) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Детали проекта
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(budgetMin || budgetMax) && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-card border hover:bg-accent/50 transition-colors">
            <Wallet
              className="h-5 w-5 text-green-600 mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                Бюджет
              </p>
              <p className="text-xl font-semibold tabular-nums text-foreground">
                {formatBudget(budgetMin, budgetMax)}
              </p>
            </div>
          </div>
        )}

        {estimatedDuration && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-card border hover:bg-accent/50 transition-colors">
            <Timer
              className="h-5 w-5 text-blue-600 mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                Длительность
              </p>
              <p className="text-xl font-semibold text-foreground">
                {estimatedDuration}
              </p>
            </div>
          </div>
        )}

        {deadline && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-card border hover:bg-accent/50 transition-colors">
            <Calendar
              className="h-5 w-5 text-orange-600 mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                Дедлайн
              </p>
              <p className="text-xl font-semibold tabular-nums text-foreground">
                {formatDate(deadline)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export { ProjectDetails };
